import { ConfigStorageMarketConfig } from "./market-config";
import { ethers } from "ethers";
import assetClasses from "../../../entities/asset-classes";

export const config:ConfigStorageMarketConfig[] = [
  {
    marketIndex: 0,
    assetId: ethers.utils.formatBytes32String("ETH"),
    maxLongPositionSize: ethers.utils.parseUnits(String(1_000_000), 30),
    maxShortPositionSize: ethers.utils.parseUnits(String(1_000_000), 30),
    increasePositionFeeRateBPS: 2, // 0.02%
    decreasePositionFeeRateBPS: 2, // 0.02%
    initialMarginFractionBPS: 200, // IMF = 1%, Max leverage = 100
    maintenanceMarginFractionBPS: 100, // MMF = 0.5%
    maxProfitRateBPS: 250000, // 2500%
    assetClass: assetClasses.crypto,
    allowIncreasePosition: true,
    active: true,
    fundingRate: {
      maxSkewScaleUSD: ethers.utils.parseUnits(String(2_000_000_000), 30), // 2000 M
      maxFundingRate: ethers.utils.parseUnits("8", 18), // 900% per day
    },
    isAdaptiveFeeEnabled: false,
  },
  {
    marketIndex: 1,
    assetId: ethers.utils.formatBytes32String("BTC"),
    maxLongPositionSize: ethers.utils.parseUnits(String(1_000_000), 30),
    maxShortPositionSize: ethers.utils.parseUnits(String(1_000_000), 30),
    increasePositionFeeRateBPS: 2, // 0.02%
    decreasePositionFeeRateBPS: 2, // 0.02%
    initialMarginFractionBPS: 200, // IMF = 1%, Max leverage = 100
    maintenanceMarginFractionBPS: 100, // MMF = 0.5%
    maxProfitRateBPS: 250000, // 2500%
    assetClass: assetClasses.crypto,
    allowIncreasePosition: true,
    active: true,
    fundingRate: {
      maxSkewScaleUSD: ethers.utils.parseUnits(String(3_000_000_000), 30), // 3000 M
      maxFundingRate: ethers.utils.parseUnits("8", 18), // 900% per day
    },
    isAdaptiveFeeEnabled: false,
  },
  {
    marketIndex: 2,
    assetId: ethers.utils.formatBytes32String("SOL"),
    maxLongPositionSize: ethers.utils.parseUnits(String(1_000_000), 30),
    maxShortPositionSize: ethers.utils.parseUnits(String(1_000_000), 30),
    increasePositionFeeRateBPS: 2, // 0.02%
    decreasePositionFeeRateBPS: 2, // 0.02%
    initialMarginFractionBPS: 200, // IMF = 1%, Max leverage = 100
    maintenanceMarginFractionBPS: 100, // MMF = 0.5%
    maxProfitRateBPS: 250000, // 2500%
    assetClass: assetClasses.crypto,
    allowIncreasePosition: true,
    active: true,
    fundingRate: {
      maxSkewScaleUSD: ethers.utils.parseUnits(String(3_000_000_000), 30), // 3000 M
      maxFundingRate: ethers.utils.parseUnits("8", 18), // 900% per day
    },
    isAdaptiveFeeEnabled: false,
  },
]