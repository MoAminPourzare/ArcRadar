import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";

describe("TipRouter", async function () {
  const { viem } = await network.create();
  const publicClient = await viem.getPublicClient();

  async function deployFixture() {
    const [tipper, recipient] = await viem.getWalletClients();
    const usdc = await viem.deployContract("MockUSDC");
    const tipRouter = await viem.deployContract("TipRouter", [usdc.address]);

    return {
      recipient,
      tipper,
      tipRouter,
      usdc,
    };
  }

  it("routes approved ERC-20 USDC to the project wallet and emits ProjectTipped", async function () {
    const { recipient, tipper, tipRouter, usdc } = await deployFixture();
    const amount = 1_000_000n;
    const message = "Shipping on Arc";
    const projectId = "arc-escrow";

    await usdc.write.mint([tipper.account.address, amount]);
    await usdc.write.approve([tipRouter.address, amount], {
      account: tipper.account,
    });

    await viem.assertions.emitWithArgs(
      tipRouter.write.tip(
        [projectId, recipient.account.address, amount, message],
        {
          account: tipper.account,
        },
      ),
      tipRouter,
      "ProjectTipped",
      [projectId, tipper.account.address, recipient.account.address, amount, message],
    );

    assert.equal(
      await usdc.read.balanceOf([recipient.account.address]),
      amount,
    );
    assert.equal(await usdc.read.balanceOf([tipper.account.address]), 0n);
  });

  it("keeps ProjectTipped events queryable for leaderboard indexing", async function () {
    const { recipient, tipper, tipRouter, usdc } = await deployFixture();
    const amount = 2_500_000n;
    const deploymentBlockNumber = await publicClient.getBlockNumber();

    await usdc.write.mint([tipper.account.address, amount]);
    await usdc.write.approve([tipRouter.address, amount], {
      account: tipper.account,
    });
    await tipRouter.write.tip(
      ["arc-commerce", recipient.account.address, amount, "Index this"],
      {
        account: tipper.account,
      },
    );

    const events = await publicClient.getContractEvents({
      abi: tipRouter.abi,
      address: tipRouter.address,
      eventName: "ProjectTipped",
      fromBlock: deploymentBlockNumber,
      strict: true,
    });

    assert.equal(events.length, 1);
    assert.equal(events[0].args.projectId, "arc-commerce");
    assert.equal(events[0].args.amount, amount);
  });

  it("rejects invalid tip inputs before attempting transfer", async function () {
    const { recipient, tipper, tipRouter } = await deployFixture();
    const longProjectId = "x".repeat(97);
    const longMessage = "x".repeat(281);

    await viem.assertions.revertWithCustomError(
      tipRouter.write.tip(["", recipient.account.address, 1n, ""], {
        account: tipper.account,
      }),
      tipRouter,
      "EmptyProjectId",
    );
    await viem.assertions.revertWithCustomError(
      tipRouter.write.tip([longProjectId, recipient.account.address, 1n, ""], {
        account: tipper.account,
      }),
      tipRouter,
      "ProjectIdTooLong",
    );
    await viem.assertions.revertWithCustomError(
      tipRouter.write.tip(
        ["arc-escrow", "0x0000000000000000000000000000000000000000", 1n, ""],
        {
          account: tipper.account,
        },
      ),
      tipRouter,
      "InvalidRecipient",
    );
    await viem.assertions.revertWithCustomError(
      tipRouter.write.tip(["arc-escrow", recipient.account.address, 0n, ""], {
        account: tipper.account,
      }),
      tipRouter,
      "AmountMustBePositive",
    );
    await viem.assertions.revertWithCustomError(
      tipRouter.write.tip(
        ["arc-escrow", recipient.account.address, 1n, longMessage],
        {
          account: tipper.account,
        },
      ),
      tipRouter,
      "MessageTooLong",
    );
  });

  it("reverts when USDC transferFrom returns false", async function () {
    const { recipient, tipper, tipRouter, usdc } = await deployFixture();
    const amount = 1_000_000n;

    await usdc.write.mint([tipper.account.address, amount]);
    await usdc.write.approve([tipRouter.address, amount], {
      account: tipper.account,
    });
    await usdc.write.setTransferFromShouldReturnFalse([true]);

    await viem.assertions.revertWithCustomError(
      tipRouter.write.tip(
        ["arc-escrow", recipient.account.address, amount, "Should fail"],
        {
          account: tipper.account,
        },
      ),
      tipRouter,
      "UsdcTransferFailed",
    );
  });
});
