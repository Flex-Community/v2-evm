import { network } from "hardhat";
import * as fs from "fs";
import ArbitrumGoerliConfig from "../../../configs/arbitrum.goerli.json";
import ArbitrumMainnetConfig from "../../../configs/arbitrum.mainnet.json";
import ArbitrumMainnetMarketConfig from "../../../configs/.arbitrum.one.market.json";
import ArbitrumGoerliMarketConfig from "../../../configs/.arbitrum.goerli.market.json";
import BaseMainnetConfig from "../../../configs/base.mainnet.json";
import BaseSepoliaConfig from "../../../configs/base.sepolia.json";

export function loadConfig(chainId: number) {
  if (chainId === 42161) {
    return ArbitrumMainnetConfig;
  }
  if (chainId === 421613) {
    return ArbitrumGoerliConfig;
  }
  if (chainId === 8453) {
    return BaseMainnetConfig;
  }
  if (chainId === 84532) {
    return BaseSepoliaConfig;
  }
  throw new Error("not found config");
}

export function loadMarketConfig(chainId: number) {
  if (chainId === 42161) {
    return ArbitrumMainnetMarketConfig;
  }
  if (chainId === 421613) {
    return ArbitrumGoerliMarketConfig;
  }
  throw new Error("not found market config");
}

export function getConfig() {
  if (network.name === "matic") {
    return ArbitrumGoerliConfig;
  }
  if (network.name === "tenderly") {
    return ArbitrumMainnetConfig;
  }
  if (network.name === "mumbai") {
    return ArbitrumGoerliConfig;
  }
  if (network.name === "arb_goerli") {
    return ArbitrumGoerliConfig;
  }
  if (network.name === "arbitrum") {
    return ArbitrumMainnetConfig;
  }

  throw new Error("not found config");
}

export function writeConfigFile(config: any) {
  let filePath;
  switch (network.name) {
    case "arbitrum":
      filePath = "./configs/arbitrum.mainnet.json";
      break;
    case "matic":
      filePath = "./configs/arbitrum.goerli.json";
      break;
    case "tenderly":
      filePath = "./configs/arbitrum.mainnet.json";
      break;
    case "mumbai":
      filePath = "./configs/arbitrum.goerli.json";
      break;
    case "arb_goerli":
      filePath = "./configs/arbitrum.goerli.json";
      break;
    default:
      throw Error("Unsupported network");
  }
  console.log(`[utils/config] Writing ${filePath}`);
  fs.writeFileSync(filePath, JSON.stringify(config, null, 2));
  console.log("[utils/config] ✅ Done");
}
