import { ethers } from "ethers";

/**
 * New config does not have marketIndex
 */
export type ConfigStorageNewMarketConfig = {
  assetId: string;
  increasePositionFeeRateBPS: number;
  decreasePositionFeeRateBPS: number;
  initialMarginFractionBPS: number;
  maintenanceMarginFractionBPS: number;
  maxProfitRateBPS: number;
  assetClass: number;
  allowIncreasePosition: boolean;
  active: boolean;
  fundingRate: {
    maxSkewScaleUSD: ethers.BigNumber;
    maxFundingRate: ethers.BigNumber;
  };
  maxLongPositionSize: ethers.BigNumber;
  maxShortPositionSize: ethers.BigNumber;
  isAdaptiveFeeEnabled: boolean;
}

export type ConfigStorageMarketConfig = ConfigStorageNewMarketConfig & {
  marketIndex: number;
};

function validateConfig(marketConfig:ConfigStorageMarketConfig[]):ConfigStorageMarketConfig[] {
  // Validate that market indices are sequential from 0 to length-1
  for (let i = 0; i < marketConfig.length; i++) {
    if (marketConfig[i].marketIndex !== i) {
      throw new Error(`Market config Error: Invalid at ${i} 'marketIndex: ${marketConfig[i].marketIndex}'. Expected ${i}`);
    }
  }
  return marketConfig;
}

function getMarketConfig(chainId:number):ConfigStorageMarketConfig[] {
  switch (chainId) {
    case 8453:
      return require('./base.mainnet.ts').config;
    default:
      throw new Error(`Chain id ${chainId} not found`);
  }
}

export async function getMarketConfigForSet(chainId:number):Promise<ConfigStorageMarketConfig[]> {
  return validateConfig(getMarketConfig(chainId));
}

export async function getMarketConfigForAdd(chainId:number):Promise<ConfigStorageNewMarketConfig[]> {
  const config = getMarketConfig(chainId);
  return config.map((marketConfig:ConfigStorageMarketConfig) => {
    const { marketIndex, ...rest } = marketConfig;
    return rest;
  })
}