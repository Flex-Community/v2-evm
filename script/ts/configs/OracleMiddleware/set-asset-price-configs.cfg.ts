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
    {
      assetId: ethers.utils.formatBytes32String("XRP"),
      confidenceThreshold: 0,
      trustPriceAge: 60 * 5, // 5 minutes
      adapter: config.oracles.pythAdapter,
    },
    {
      assetId: ethers.utils.formatBytes32String("BNB"),
      confidenceThreshold: 0,
      trustPriceAge: 60 * 5, // 5 minutes
      adapter: config.oracles.pythAdapter,
    },
    {
      assetId: ethers.utils.formatBytes32String("DOGE"),
      confidenceThreshold: 0,
      trustPriceAge: 60 * 5, // 5 minutes
      adapter: config.oracles.pythAdapter,
    },
    {
      assetId: ethers.utils.formatBytes32String("TRX"),
      confidenceThreshold: 0,
      trustPriceAge: 60 * 5, // 5 minutes
      adapter: config.oracles.pythAdapter,
    },
    {
      assetId: ethers.utils.formatBytes32String("ADA"),
      confidenceThreshold: 0,
      trustPriceAge: 60 * 5, // 5 minutes
      adapter: config.oracles.pythAdapter,
    },
    {
      assetId: ethers.utils.formatBytes32String("TON"),
      confidenceThreshold: 0,
      trustPriceAge: 60 * 5, // 5 minutes
      adapter: config.oracles.pythAdapter,
    },
    {
      assetId: ethers.utils.formatBytes32String("LINK"),
      confidenceThreshold: 0,
      trustPriceAge: 60 * 5, // 5 minutes
      adapter: config.oracles.pythAdapter,
    },
    {
      assetId: ethers.utils.formatBytes32String("VIRTUAL"),
      confidenceThreshold: 0,
      trustPriceAge: 60 * 5, // 5 minutes
      adapter: config.oracles.pythAdapter,
    },
    {
      assetId: ethers.utils.formatBytes32String("AVAX"),
      confidenceThreshold: 0,
      trustPriceAge: 60 * 5, // 5 minutes
      adapter: config.oracles.pythAdapter,
    },
    {
      assetId: ethers.utils.formatBytes32String("HBAR"),
      confidenceThreshold: 0,
      trustPriceAge: 60 * 5, // 5 minutes
      adapter: config.oracles.pythAdapter,
    },
    {
      assetId: ethers.utils.formatBytes32String("SUI"),
      confidenceThreshold: 0,
      trustPriceAge: 60 * 5, // 5 minutes
      adapter: config.oracles.pythAdapter,
    },
    {
      assetId: ethers.utils.formatBytes32String("SHIB"),
      confidenceThreshold: 0,
      trustPriceAge: 60 * 5, // 5 minutes
      adapter: config.oracles.pythAdapter,
    },
    {
      assetId: ethers.utils.formatBytes32String("AAVE"),
      confidenceThreshold: 0,
      trustPriceAge: 60 * 5, // 5 minutes
      adapter: config.oracles.pythAdapter,
    },
    {
      assetId: ethers.utils.formatBytes32String("PENDLE"),
      confidenceThreshold: 0,
      trustPriceAge: 60 * 5, // 5 minutes
      adapter: config.oracles.pythAdapter,
    },
    {
      assetId: ethers.utils.formatBytes32String("UNI"),
      confidenceThreshold: 0,
      trustPriceAge: 60 * 5, // 5 minutes
      adapter: config.oracles.pythAdapter,
    },
    {
      assetId: ethers.utils.formatBytes32String("PEPE"),
      confidenceThreshold: 0,
      trustPriceAge: 60 * 5, // 5 minutes
      adapter: config.oracles.pythAdapter,
    },
    {
      assetId: ethers.utils.formatBytes32String("HYPE"),
      confidenceThreshold: 0,
      trustPriceAge: 60 * 5, // 5 minutes
      adapter: config.oracles.pythAdapter,
    },
    {
      assetId: ethers.utils.formatBytes32String("AERO"),
      confidenceThreshold: 0,
      trustPriceAge: 60 * 5, // 5 minutes
      adapter: config.oracles.pythAdapter,
    },
    {
      assetId: ethers.utils.formatBytes32String("BRETT"),
      confidenceThreshold: 0,
      trustPriceAge: 60 * 5, // 5 minutes
      adapter: config.oracles.pythAdapter,
    },
    {
      assetId: ethers.utils.formatBytes32String("XAU"),
      confidenceThreshold: 0,
      trustPriceAge: 60 * 5, // 5 minutes
      adapter: config.oracles.pythAdapter,
    },
    {
      assetId: ethers.utils.formatBytes32String("USOIL"),
      confidenceThreshold: 0,
      trustPriceAge: 60 * 5, // 5 minutes
      adapter: config.oracles.pythAdapter,
    },
    {
      assetId: ethers.utils.formatBytes32String("AAPL"),
      confidenceThreshold: 0,
      trustPriceAge: 60 * 5, // 5 minutes
      adapter: config.oracles.pythAdapter,
    },
    {
      assetId: ethers.utils.formatBytes32String("MSTR"),
      confidenceThreshold: 0,
      trustPriceAge: 60 * 5, // 5 minutes
      adapter: config.oracles.pythAdapter,
    },
    {
      assetId: ethers.utils.formatBytes32String("TSLA"),
      confidenceThreshold: 0,
      trustPriceAge: 60 * 5, // 5 minutes
      adapter: config.oracles.pythAdapter,
    },
    {
      assetId: ethers.utils.formatBytes32String("NVDA"),
      confidenceThreshold: 0,
      trustPriceAge: 60 * 5, // 5 minutes
      adapter: config.oracles.pythAdapter,
    },
    {
      assetId: ethers.utils.formatBytes32String("FARTCOIN"),
      confidenceThreshold: 0,
      trustPriceAge: 60 * 5, // 5 minutes
      adapter: config.oracles.pythAdapter,
    },
    {
      assetId: ethers.utils.formatBytes32String("WIF"),
      confidenceThreshold: 0,
      trustPriceAge: 60 * 5, // 5 minutes
      adapter: config.oracles.pythAdapter,
    },
    {
      assetId: ethers.utils.formatBytes32String("BONK"),
      confidenceThreshold: 0,
      trustPriceAge: 60 * 5, // 5 minutes
      adapter: config.oracles.pythAdapter,
    },
    {
      assetId: ethers.utils.formatBytes32String("TAO"),
      confidenceThreshold: 0,
      trustPriceAge: 60 * 5, // 5 minutes
      adapter: config.oracles.pythAdapter,
    },
    {
      assetId: ethers.utils.formatBytes32String("JUP"),
      confidenceThreshold: 0,
      trustPriceAge: 60 * 5, // 5 minutes
      adapter: config.oracles.pythAdapter,
    },

    
  ];

}