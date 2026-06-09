import { network } from "hardhat";

const arcTestnetUsdc = "0x3600000000000000000000000000000000000000";

const { viem } = await network.create();

const tipRouter = await viem.deployContract("TipRouter", [arcTestnetUsdc]);

console.log(
  JSON.stringify(
    {
      contract: "TipRouter",
      network: "arcTestnet",
      tipRouter: tipRouter.address,
      usdc: arcTestnetUsdc,
    },
    null,
    2,
  ),
);
