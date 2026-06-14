import { network } from "hardhat";

const arcTestnetUsdc = "0x3600000000000000000000000000000000000000";
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

console.log(
  JSON.stringify(
    {
      contract: "TipRouter",
      deployer: deployer.account.address,
      deploymentBlock: deploymentReceipt.blockNumber.toString(),
      network: "arcTestnet",
      tipRouter: tipRouter.address,
      usdc: arcTestnetUsdc,
    },
    null,
    2,
  ),
);
