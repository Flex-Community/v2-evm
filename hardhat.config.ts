import { config as dotEnvConfig } from "dotenv";
import { HardhatUserConfig, task } from "hardhat/config";
import fs from "fs";
dotEnvConfig();

import * as tdly from "@tenderly/hardhat-tenderly";
tdly.setup({ automaticVerifications: false });

import "@openzeppelin/hardhat-upgrades";
import "hardhat-preprocessor";
import "@typechain/hardhat";
import "@nomiclabs/hardhat-ethers";
import "hardhat-deploy";
import "@nomicfoundation/hardhat-verify";
import "@flex-community/hardhat-tenderly-signer";

// import { task } from "hardhat";
import { getImplementationAddress } from "@openzeppelin/upgrades-core";

task("tenderly-verify-proxy", "")
  .addParam("address", "The contract address")
  .addParam("contract", "The contract name")
  .setAction(async (args:any, hre:any) => {
    console.log("Implementation at ", await getImplementationAddress(hre.network.provider, args.address));
    await hre.tenderly.verify({
      address: await getImplementationAddress(hre.network.provider, args.address),
      name: args.contract,
    });

  });

task("tenderly-verify", "")
  .addParam("address", "The contract address")
  .addParam("contract", "The contract name")
  .setAction(async (args:any, hre:any) => {
    await hre.tenderly.verify({
      address: args.address,
      name: args.contract,
    });

  });

function getRemappings() {
  return fs
    .readFileSync("remappings.txt", "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => line.trim().split("="));
}

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  networks: {
    tenderly: {
      url: process.env.TENDERLY_RPC || "",
      tenderlySignerAddress: "0x0000C5b439c9B902A21eF1F5365cbdF7e696A000",
      //accounts: process.env.MAINNET_PRIVATE_KEY !== undefined ? [process.env.MAINNET_PRIVATE_KEY] : [],
    },
    arbitrum: {
      url: process.env.ARBITRUM_MAINNET_RPC || "",
      accounts: [process.env.MAINNET_PRIVATE_KEY || ""],
    },
    base: {
      url: process.env.BASE_MAINNET_RPC || "",
      chainId: 8453,
      accounts: process.env.MAINNET_PRIVATE_KEY !== undefined ? [process.env.MAINNET_PRIVATE_KEY] : [],
    },
    base_sepolia: {
      url: process.env.BASE_SEPOLIA_RPC || "",
      chainId: 84532,
      accounts: process.env.MAINNET_PRIVATE_KEY !== undefined ? [process.env.MAINNET_PRIVATE_KEY] : [],
    },
    tenderly_base_sepolia: {
      url: process.env.TENDERLY_BASE_SEPOLIA_RPC || "",
      chainId: 8453,
      accounts: process.env.MAINNET_PRIVATE_KEY !== undefined ? [process.env.MAINNET_PRIVATE_KEY] : [],
    },
  },
  solidity: {
    version: "0.8.18",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1,
      },
    },
  },
  paths: {
    sources: process.env.HH_PATH_SOURCES || "./src",
    cache: "./cache_hardhat",
    artifacts: "./artifacts",
  },
  typechain: {
    outDir: "./typechain",
    target: "ethers-v5",
  },
  tenderly: {
    project: process.env.TENDERLY_PROJECT_NAME!,
    username: process.env.TENDERLY_USERNAME!,
    privateVerification: true,
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY!,
    customChains: [
      {
        network: "base",
        chainId: 8453,
        urls: {
          apiURL: "https://api.etherscan.io/v2/api?chainid=8453",
          browserURL: "https://www.basescan.org",
        },
      },
      {
        network: "baseSepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api.etherscan.io/v2/api?chainid=84532",
          browserURL: "https://sepolia.basescan.org/",
        },
      },
    ],
  },
  // This fully resolves paths for imports in the ./lib directory for Hardhat
  preprocess: {
    eachLine: (hre) => ({
      transform: (line: string) => {
        if (line.match(/^\s*import /i)) {
          getRemappings().forEach(([find, replace]) => {
            if (line.match(find)) {
              line = line.replace(find, replace);
            }
          });
        }
        return line;
      },
    }),
  },
};

if (fs.existsSync("./hardhat.config.local.ts")) {
  const module = require('./hardhat.config.local.ts');
  if (module.configExtender) {
    module.configExtender(config);
  }
}

export default config;
