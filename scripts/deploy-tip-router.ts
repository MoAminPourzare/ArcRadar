import { network } from "hardhat";
import { getAddress, isAddress } from "viem";

const arcTestnetUsdc = "0x3600000000000000000000000000000000000000";
const demoProjectSlugs = [
  "arc-escrow",
  "arc-commerce",
  "unified-usdc",
  "arc-router",
  "arc-index-kit",
  "arc-dev-console",
] as const;

const rawRecipient = process.env.TIP_DEMO_RECIPIENT_ADDRESS;

if (!rawRecipient || !isAddress(rawRecipient)) {
  throw new Error(
    "TIP_DEMO_RECIPIENT_ADDRESS must be set to a valid Arc Testnet address.",
  );
}

const recipient = getAddress(rawRecipient);
const { viem } = await network.create();
const publicClient = await viem.getPublicClient();
const [deployer] = await viem.getWalletClients();
const { contract: tipRouter, deploymentTransaction } =
  await viem.sendDeploymentTransaction("TipRouter", [arcTestnetUsdc], {
    client: { public: publicClient, wallet: deployer },
  });
const deploymentReceipt = await publicClient.waitForTransactionReceipt({
  confirmations: 2,
  hash: deploymentTransaction.hash,
});

const registryHash = await tipRouter.write.setProjectRecipients(
  [demoProjectSlugs, demoProjectSlugs.map(() => recipient)],
  { account: deployer.account },
);
await publicClient.waitForTransactionReceipt({
  confirmations: 2,
  hash: registryHash,
});

for (const projectSlug of demoProjectSlugs) {
  const registeredRecipient = await tipRouter.read.getProjectRecipient([
    projectSlug,
  ]);

  if (registeredRecipient.toLowerCase() !== recipient.toLowerCase()) {
    throw new Error(`Registry verification failed for ${projectSlug}.`);
  }
}

console.log(
  JSON.stringify(
    {
      contract: "TipRouter",
      deployer: deployer.account.address,
      deploymentBlock: deploymentReceipt.blockNumber.toString(),
      network: "arcTestnet",
      projectsRegistered: demoProjectSlugs.length,
      recipient,
      registryTransactionHash: registryHash,
      tipRouter: tipRouter.address,
      usdc: arcTestnetUsdc,
    },
    null,
    2,
  ),
);
