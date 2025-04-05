import { ethers } from "ethers";
import { loadConfig } from "../../utils/config";

export function getConfig_SetAssetPriceConfigs(chainId:number) {
  const config = loadConfig(chainId);
  return [
    {
      assetId: ethers.utils.formatBytes32String("ETH"),
      confidenceThreshold: 0,
      trustPriceAge: 60 * 5, // 5 minutes
      adapter: config.oracles.pythAdapter,
    },
    {
      assetId: ethers.utils.formatBytes32String("BTC"),
      confidenceThreshold: 0,
      trustPriceAge: 60 * 5, // 5 minutes
      adapter: config.oracles.pythAdapter,
    },
    {
      assetId: ethers.utils.formatBytes32String("USDC"),
      confidenceThreshold: 0,
      trustPriceAge: 60 * 5, // 5 minutes
      adapter: config.oracles.pythAdapter,
    },
    {
      assetId: ethers.utils.formatBytes32String("SOL"),
      confidenceThreshold: 0,
      trustPriceAge: 60 * 5, // 5 minutes
      adapter: config.oracles.pythAdapter,
    },
  ];

}