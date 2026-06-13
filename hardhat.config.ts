import hardhatNodeTestRunner from "@nomicfoundation/hardhat-node-test-runner";
import hardhatViem from "@nomicfoundation/hardhat-viem";
import hardhatViemAssertions from "@nomicfoundation/hardhat-viem-assertions";
import { configVariable, defineConfig } from "hardhat/config";

import { loadLocalEnv } from "./src/server/env/load-local-env.js";

loadLocalEnv();

export default defineConfig({
  plugins: [hardhatViem, hardhatViemAssertions, hardhatNodeTestRunner],
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    arcTestnet: {
      accounts: [configVariable("ARC_TESTNET_PRIVATE_KEY")],
      chainType: "l1",
      type: "http",
      url: configVariable("ARC_TESTNET_RPC_URL"),
    },
    hardhatMainnet: {
      chainType: "l1",
      type: "edr-simulated",
    },
  },
});
