import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";

describe("TipRouter", async function () {
  const { viem } = await network.create();
  const publicClient = await viem.getPublicClient();

  async function deployFixture() {
    const [owner, tipper, recipient, attacker] = await viem.getWalletClients();
    const usdc = await viem.deployContract("MockUSDC");
    const tipRouter = await viem.deployContract("TipRouter", [usdc.address], {
      client: { wallet: owner },
    });

    return {
      attacker,
      owner,
      recipient,
      tipper,
      tipRouter,
      usdc,
    };
  }

  async function registerProject(
    fixture: Awaited<ReturnType<typeof deployFixture>>,
    projectId = "arc-escrow",
  ) {
    await fixture.tipRouter.write.setProjectRecipient(
      [projectId, fixture.recipient.account.address],
      { account: fixture.owner.account },
    );
  }

  it("rejects a zero USDC token address at deployment", async function () {
    await assert.rejects(
      viem.deployContract("TipRouter", [
        "0x0000000000000000000000000000000000000000",
      ]),
      /InvalidUsdc/,
    );
  });

  it("registers curated projects and prevents unauthorized registry changes", async function () {
    const fixture = await deployFixture();

    await viem.assertions.emitWithArgs(
      fixture.tipRouter.write.setProjectRecipient(
        ["arc-escrow", fixture.recipient.account.address],
        { account: fixture.owner.account },
      ),
      fixture.tipRouter,
      "ProjectRecipientSet",
      ["arc-escrow", fixture.recipient.account.address],
    );

    assert.equal(
      (
        await fixture.tipRouter.read.getProjectRecipient(["arc-escrow"])
      ).toLowerCase(),
      fixture.recipient.account.address.toLowerCase(),
    );

    await viem.assertions.revertWithCustomError(
      fixture.tipRouter.write.setProjectRecipient(
        ["arc-escrow", fixture.attacker.account.address],
        { account: fixture.attacker.account },
      ),
      fixture.tipRouter,
      "Unauthorized",
    );
  });

  it("routes approved USDC only to the registered project wallet", async function () {
    const fixture = await deployFixture();
    const amount = 1_000_000n;
    const message = "Shipping on Arc";
    const projectId = "arc-escrow";

    await registerProject(fixture, projectId);
    await fixture.usdc.write.mint([fixture.tipper.account.address, amount]);
    await fixture.usdc.write.approve([fixture.tipRouter.address, amount], {
      account: fixture.tipper.account,
    });

    await viem.assertions.emitWithArgs(
      fixture.tipRouter.write.tip([projectId, amount, message], {
        account: fixture.tipper.account,
      }),
      fixture.tipRouter,
      "ProjectTipped",
      [
        projectId,
        fixture.tipper.account.address,
        fixture.recipient.account.address,
        amount,
        message,
      ],
    );

    assert.equal(
      await fixture.usdc.read.balanceOf([fixture.recipient.account.address]),
      amount,
    );
    assert.equal(
      await fixture.usdc.read.balanceOf([fixture.attacker.account.address]),
      0n,
    );
  });

  it("supports batch registration, recipient updates, and project removal", async function () {
    const fixture = await deployFixture();

    await fixture.tipRouter.write.setProjectRecipients(
      [
        ["arc-escrow", "arc-commerce"],
        [fixture.recipient.account.address, fixture.attacker.account.address],
      ],
      { account: fixture.owner.account },
    );

    assert.equal(
      (
        await fixture.tipRouter.read.getProjectRecipient(["arc-commerce"])
      ).toLowerCase(),
      fixture.attacker.account.address.toLowerCase(),
    );

    await fixture.tipRouter.write.setProjectRecipient(
      ["arc-commerce", fixture.recipient.account.address],
      { account: fixture.owner.account },
    );
    await fixture.tipRouter.write.removeProjectRecipient(["arc-commerce"], {
      account: fixture.owner.account,
    });

    assert.equal(
      await fixture.tipRouter.read.getProjectRecipient(["arc-commerce"]),
      "0x0000000000000000000000000000000000000000",
    );
  });

  it("keeps ProjectTipped events queryable for leaderboard indexing", async function () {
    const fixture = await deployFixture();
    const amount = 2_500_000n;
    const deploymentBlockNumber = await publicClient.getBlockNumber();

    await registerProject(fixture, "arc-commerce");
    await fixture.usdc.write.mint([fixture.tipper.account.address, amount]);
    await fixture.usdc.write.approve([fixture.tipRouter.address, amount], {
      account: fixture.tipper.account,
    });
    await fixture.tipRouter.write.tip(
      ["arc-commerce", amount, "Index this"],
      { account: fixture.tipper.account },
    );

    const events = await publicClient.getContractEvents({
      abi: fixture.tipRouter.abi,
      address: fixture.tipRouter.address,
      eventName: "ProjectTipped",
      fromBlock: deploymentBlockNumber,
      strict: true,
    });

    assert.equal(events.length, 1);
    assert.equal(events[0].args.projectId, "arc-commerce");
    assert.equal(events[0].args.amount, amount);
  });

  it("rejects invalid, missing, and unregistered projects", async function () {
    const fixture = await deployFixture();
    const longProjectId = "x".repeat(97);

    await viem.assertions.revertWithCustomError(
      fixture.tipRouter.write.setProjectRecipient(
        ["", fixture.recipient.account.address],
        { account: fixture.owner.account },
      ),
      fixture.tipRouter,
      "EmptyProjectId",
    );
    await viem.assertions.revertWithCustomError(
      fixture.tipRouter.write.setProjectRecipient(
        [longProjectId, fixture.recipient.account.address],
        { account: fixture.owner.account },
      ),
      fixture.tipRouter,
      "ProjectIdTooLong",
    );
    await viem.assertions.revertWithCustomError(
      fixture.tipRouter.write.tip(["not-curated", 1n, ""], {
        account: fixture.tipper.account,
      }),
      fixture.tipRouter,
      "ProjectNotRegistered",
    );
  });

  it("rejects invalid amounts, messages, allowance, and balance", async function () {
    const fixture = await deployFixture();
    const amount = 1_000_000n;

    await registerProject(fixture);

    await viem.assertions.revertWithCustomError(
      fixture.tipRouter.write.tip(["arc-escrow", 0n, ""], {
        account: fixture.tipper.account,
      }),
      fixture.tipRouter,
      "AmountMustBePositive",
    );
    await viem.assertions.revertWithCustomError(
      fixture.tipRouter.write.tip(["arc-escrow", 1n, "x".repeat(281)], {
        account: fixture.tipper.account,
      }),
      fixture.tipRouter,
      "MessageTooLong",
    );

    await fixture.usdc.write.mint([fixture.tipper.account.address, amount]);
    await viem.assertions.revertWithCustomError(
      fixture.tipRouter.write.tip(["arc-escrow", amount, "No allowance"], {
        account: fixture.tipper.account,
      }),
      fixture.tipRouter,
      "UsdcTransferFailed",
    );

    await fixture.usdc.write.approve([fixture.tipRouter.address, amount * 2n], {
      account: fixture.tipper.account,
    });
    await viem.assertions.revertWithCustomError(
      fixture.tipRouter.write.tip(["arc-escrow", amount * 2n, "No balance"], {
        account: fixture.tipper.account,
      }),
      fixture.tipRouter,
      "UsdcTransferFailed",
    );
  });

  it("transfers ownership without weakening registry authorization", async function () {
    const fixture = await deployFixture();

    await fixture.tipRouter.write.transferOwnership(
      [fixture.attacker.account.address],
      { account: fixture.owner.account },
    );

    await viem.assertions.revertWithCustomError(
      fixture.tipRouter.write.setProjectRecipient(
        ["arc-escrow", fixture.recipient.account.address],
        { account: fixture.owner.account },
      ),
      fixture.tipRouter,
      "Unauthorized",
    );

    await fixture.tipRouter.write.setProjectRecipient(
      ["arc-escrow", fixture.recipient.account.address],
      { account: fixture.attacker.account },
    );
  });
});
