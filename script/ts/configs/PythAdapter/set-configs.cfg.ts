import { ethers } from "ethers";

export const SET_CONFIGS = [
  {
    assetId: ethers.utils.formatBytes32String("ETH"),
    pythPriceId: ethers.utils.formatBytes32String("ETH"),
    inverse: false,
  },
  {
    assetId: ethers.utils.formatBytes32String("BTC"),
    pythPriceId: ethers.utils.formatBytes32String("BTC"),
    inverse: false,
  },
  {
    assetId: ethers.utils.formatBytes32String("USDC"),
    pythPriceId: ethers.utils.formatBytes32String("USDC"),
    inverse: false,
  },
  {
    assetId: ethers.utils.formatBytes32String("SOL"),
    pythPriceId: ethers.utils.formatBytes32String("SOL"),
    inverse: false,
  },
];
