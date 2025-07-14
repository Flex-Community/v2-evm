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
    maxLongPositionSize: ethers.utils.parseUnits(String(250_000), 30),
    maxShortPositionSize: ethers.utils.parseUnits(String(250_000), 30),
    increasePositionFeeRateBPS: 3, // 0.02%
    decreasePositionFeeRateBPS: 3, // 0.02%
    initialMarginFractionBPS: 400, // IMF = 2%, Max leverage = 100
    maintenanceMarginFractionBPS: 200, // MMF = 1%
    maxProfitRateBPS: 125000, // 1250%
    assetClass: assetClasses.crypto,
    allowIncreasePosition: true,
    active: true,
    fundingRate: {
      maxSkewScaleUSD: ethers.utils.parseUnits(String(200_000_000), 30), // 3000 M
      maxFundingRate: ethers.utils.parseUnits("8", 18), // 800% per day
    },
    isAdaptiveFeeEnabled: false,
  },

  {
    marketIndex: 3,
    assetId: ethers.utils.formatBytes32String("XRP"),
    maxLongPositionSize: ethers.utils.parseUnits(String(150_000), 30),
    maxShortPositionSize: ethers.utils.parseUnits(String(150_000), 30),
    increasePositionFeeRateBPS: 5, // 0.05%
    decreasePositionFeeRateBPS: 5, // 0.05%
    initialMarginFractionBPS: 400, // IMF = 2%, Max leverage = 100
    maintenanceMarginFractionBPS: 200, // MMF = 1%
    maxProfitRateBPS: 125000, // 1250%
    assetClass: assetClasses.crypto,
    allowIncreasePosition: true,
    active: true,
    fundingRate: {
      maxSkewScaleUSD: ethers.utils.parseUnits(String(200_000_000), 30), // 3000 M
      maxFundingRate: ethers.utils.parseUnits("8", 18), // 800% per day
    },
    isAdaptiveFeeEnabled: true,
  },
  {
    marketIndex: 4,
    assetId: ethers.utils.formatBytes32String("BNB"),
    maxLongPositionSize: ethers.utils.parseUnits(String(150_000), 30),
    maxShortPositionSize: ethers.utils.parseUnits(String(150_000), 30),
    increasePositionFeeRateBPS: 5, // 0.05%
    decreasePositionFeeRateBPS: 5, // 0.05%
    initialMarginFractionBPS: 400, // IMF = 2%, Max leverage = 100
    maintenanceMarginFractionBPS: 200, // MMF = 1%
    maxProfitRateBPS: 125000, // 1250%
    assetClass: assetClasses.crypto,
    allowIncreasePosition: true,
    active: true,
    fundingRate: {
      maxSkewScaleUSD: ethers.utils.parseUnits(String(200_000_000), 30), // 3000 M
      maxFundingRate: ethers.utils.parseUnits("8", 18), // 800% per day
    },
    isAdaptiveFeeEnabled: true,
  },
  {
    marketIndex: 5,
    assetId: ethers.utils.formatBytes32String("DOGE"),
    maxLongPositionSize: ethers.utils.parseUnits(String(150_000), 30),
    maxShortPositionSize: ethers.utils.parseUnits(String(150_000), 30),
    increasePositionFeeRateBPS: 5, // 0.05%
    decreasePositionFeeRateBPS: 5, // 0.05%
    initialMarginFractionBPS: 1000, // IMF = 5%, Max leverage = 10
    maintenanceMarginFractionBPS: 500, // MMF = 1%
    maxProfitRateBPS: 50000, // 500%
    assetClass: assetClasses.crypto,
    allowIncreasePosition: true,
    active: true,
    fundingRate: {
      maxSkewScaleUSD: ethers.utils.parseUnits(String(200_000_000), 30), // 3000 M
      maxFundingRate: ethers.utils.parseUnits("8", 18), // 800% per day
    },
    isAdaptiveFeeEnabled: true,
  },
  {
    marketIndex: 6,
    assetId: ethers.utils.formatBytes32String("TRX"),
    maxLongPositionSize: ethers.utils.parseUnits(String(150_000), 30),
    maxShortPositionSize: ethers.utils.parseUnits(String(150_000), 30),
    increasePositionFeeRateBPS: 5, // 0.05%
    decreasePositionFeeRateBPS: 5, // 0.05%
    initialMarginFractionBPS: 400, // IMF = 2%, Max leverage = 100
    maintenanceMarginFractionBPS: 200, // MMF = 1%
    maxProfitRateBPS: 125000, // 1250%
    assetClass: assetClasses.crypto,
    allowIncreasePosition: true,
    active: true,
    fundingRate: {
      maxSkewScaleUSD: ethers.utils.parseUnits(String(200_000_000), 30), // 3000 M
      maxFundingRate: ethers.utils.parseUnits("8", 18), // 800% per day
    },
    isAdaptiveFeeEnabled: true,
  },
  {
    marketIndex: 7,
    assetId: ethers.utils.formatBytes32String("ADA"),
    maxLongPositionSize: ethers.utils.parseUnits(String(150_000), 30),
    maxShortPositionSize: ethers.utils.parseUnits(String(150_000), 30),
    increasePositionFeeRateBPS: 5, // 0.05%
    decreasePositionFeeRateBPS: 5, // 0.05%
    initialMarginFractionBPS: 400, // IMF = 4%, Max leverage = 100
    maintenanceMarginFractionBPS: 200, // MMF = 1%
    maxProfitRateBPS: 125000, // 1250%
    assetClass: assetClasses.crypto,
    allowIncreasePosition: true,
    active: true,
    fundingRate: {
      maxSkewScaleUSD: ethers.utils.parseUnits(String(200_000_000), 30), // 3000 M
      maxFundingRate: ethers.utils.parseUnits("8", 18), // 800% per day
    },
    isAdaptiveFeeEnabled: true,
  },
  {
    marketIndex: 8,
    assetId: ethers.utils.formatBytes32String("TON"),
    maxLongPositionSize: ethers.utils.parseUnits(String(150_000), 30),
    maxShortPositionSize: ethers.utils.parseUnits(String(150_000), 30),
    increasePositionFeeRateBPS: 5, // 0.05%
    decreasePositionFeeRateBPS: 5, // 0.05%
    initialMarginFractionBPS: 1000, // IMF = 10%, Max leverage = 10
    maintenanceMarginFractionBPS: 500, // MMF = 1%
    maxProfitRateBPS: 50000, // 500%
    assetClass: assetClasses.crypto,
    allowIncreasePosition: true,
    active: true,
    fundingRate: {
      maxSkewScaleUSD: ethers.utils.parseUnits(String(200_000_000), 30), // 3000 M
      maxFundingRate: ethers.utils.parseUnits("8", 18), // 800% per day
    },
    isAdaptiveFeeEnabled: true,
  },
  {
    marketIndex: 9,
    assetId: ethers.utils.formatBytes32String("LINK"),
    maxLongPositionSize: ethers.utils.parseUnits(String(150_000), 30),
    maxShortPositionSize: ethers.utils.parseUnits(String(150_000), 30),
    increasePositionFeeRateBPS: 5, // 0.05%
    decreasePositionFeeRateBPS: 5, // 0.05%
    initialMarginFractionBPS: 1000, // IMF = 10%, Max leverage = 10
    maintenanceMarginFractionBPS: 500, // MMF = 1%
    maxProfitRateBPS: 50000, // 500%
    assetClass: assetClasses.crypto,
    allowIncreasePosition: true,
    active: true,
    fundingRate: {
      maxSkewScaleUSD: ethers.utils.parseUnits(String(200_000_000), 30), // 3000 M
      maxFundingRate: ethers.utils.parseUnits("8", 18), // 800% per day
    },
    isAdaptiveFeeEnabled: true,
  },
  {
    marketIndex: 10,
    assetId: ethers.utils.formatBytes32String("VIRTUAL"),
    maxLongPositionSize: ethers.utils.parseUnits(String(150_000), 30),
    maxShortPositionSize: ethers.utils.parseUnits(String(150_000), 30),
    increasePositionFeeRateBPS: 5, // 0.05%
    decreasePositionFeeRateBPS: 5, // 0.05%
    initialMarginFractionBPS: 2000, // IMF = 20%, Max leverage = 5
    maintenanceMarginFractionBPS: 1000, // MMF = 1%
    maxProfitRateBPS: 25000, // 250%
    assetClass: assetClasses.crypto,
    allowIncreasePosition: true,
    active: true,
    fundingRate: {
      maxSkewScaleUSD: ethers.utils.parseUnits(String(200_000_000), 30), // 3000 M
      maxFundingRate: ethers.utils.parseUnits("8", 18), // 800% per day
    },
    isAdaptiveFeeEnabled: true,
  },
  {
    marketIndex: 11,
    assetId: ethers.utils.formatBytes32String("AVAX"),
    maxLongPositionSize: ethers.utils.parseUnits(String(150_000), 30),
    maxShortPositionSize: ethers.utils.parseUnits(String(150_000), 30),
    increasePositionFeeRateBPS: 5, // 0.05%
    decreasePositionFeeRateBPS: 5, // 0.05%
    initialMarginFractionBPS: 400, // IMF = 4%, Max leverage = 25
    maintenanceMarginFractionBPS: 200, // MMF = 1%
    maxProfitRateBPS: 125000, // 1250%
    assetClass: assetClasses.crypto,
    allowIncreasePosition: true,
    active: true,
    fundingRate: {
      maxSkewScaleUSD: ethers.utils.parseUnits(String(200_000_000), 30), // 3000 M
      maxFundingRate: ethers.utils.parseUnits("8", 18), // 800% per day
    },
    isAdaptiveFeeEnabled: true,
  },
  {
    marketIndex: 12,
    assetId: ethers.utils.formatBytes32String("HBAR"),
    maxLongPositionSize: ethers.utils.parseUnits(String(150_000), 30),
    maxShortPositionSize: ethers.utils.parseUnits(String(150_000), 30),
    increasePositionFeeRateBPS: 5, // 0.05%
    decreasePositionFeeRateBPS: 5, // 0.05%
    initialMarginFractionBPS: 1000, // IMF = 10%, Max leverage = 10
    maintenanceMarginFractionBPS: 500, // MMF = 1%
    maxProfitRateBPS: 50000, // 500%
    assetClass: assetClasses.crypto,
    allowIncreasePosition: true,
    active: true,
    fundingRate: {
      maxSkewScaleUSD: ethers.utils.parseUnits(String(200_000_000), 30), // 3000 M
      maxFundingRate: ethers.utils.parseUnits("8", 18), // 800% per day
    },
    isAdaptiveFeeEnabled: true,
  },
  {
    marketIndex: 13,
    assetId: ethers.utils.formatBytes32String("SUI"),
    maxLongPositionSize: ethers.utils.parseUnits(String(150_000), 30),
    maxShortPositionSize: ethers.utils.parseUnits(String(150_000), 30),
    increasePositionFeeRateBPS: 5, // 0.05%
    decreasePositionFeeRateBPS: 5, // 0.05%
    initialMarginFractionBPS: 1000, // IMF = 10%, Max leverage = 10
    maintenanceMarginFractionBPS: 500, // MMF = 1%
    maxProfitRateBPS: 50000, // 500%
    assetClass: assetClasses.crypto,
    allowIncreasePosition: true,
    active: true,
    fundingRate: {
      maxSkewScaleUSD: ethers.utils.parseUnits(String(200_000_000), 30), // 3000 M
      maxFundingRate: ethers.utils.parseUnits("8", 18), // 800% per day
    },
    isAdaptiveFeeEnabled: true,
  },
  {
    marketIndex: 14,
    assetId: ethers.utils.formatBytes32String("SHIB"),
    maxLongPositionSize: ethers.utils.parseUnits(String(150_000), 30),
    maxShortPositionSize: ethers.utils.parseUnits(String(150_000), 30),
    increasePositionFeeRateBPS: 5, // 0.05%
    decreasePositionFeeRateBPS: 5, // 0.05%
    initialMarginFractionBPS: 2000, // IMF = 20%, Max leverage = 5
    maintenanceMarginFractionBPS: 1000, // MMF = 1%
    maxProfitRateBPS: 25000, // 250%
    assetClass: assetClasses.crypto,
    allowIncreasePosition: true,
    active: true,
    fundingRate: {
      maxSkewScaleUSD: ethers.utils.parseUnits(String(200_000_000), 30), // 3000 M
      maxFundingRate: ethers.utils.parseUnits("8", 18), // 800% per day
    },
    isAdaptiveFeeEnabled: true,
  },
  {
    marketIndex: 15,
    assetId: ethers.utils.formatBytes32String("AAVE"),
    maxLongPositionSize: ethers.utils.parseUnits(String(150_000), 30),
    maxShortPositionSize: ethers.utils.parseUnits(String(150_000), 30),
    increasePositionFeeRateBPS: 5, // 0.05%
    decreasePositionFeeRateBPS: 5, // 0.05%
    initialMarginFractionBPS: 1000, // IMF = 10%, Max leverage = 10
    maintenanceMarginFractionBPS: 500, // MMF = 1%
    maxProfitRateBPS: 50000, // 500%
    assetClass: assetClasses.crypto,
    allowIncreasePosition: true,
    active: true,
    fundingRate: {
      maxSkewScaleUSD: ethers.utils.parseUnits(String(200_000_000), 30), // 3000 M
      maxFundingRate: ethers.utils.parseUnits("8", 18), // 800% per day
    },
    isAdaptiveFeeEnabled: true,
  },
  {
    marketIndex: 16,
    assetId: ethers.utils.formatBytes32String("PENDLE"),
    maxLongPositionSize: ethers.utils.parseUnits(String(150_000), 30),
    maxShortPositionSize: ethers.utils.parseUnits(String(150_000), 30),
    increasePositionFeeRateBPS: 5, // 0.05%
    decreasePositionFeeRateBPS: 5, // 0.05%
    initialMarginFractionBPS: 2000, // IMF = 20%, Max leverage = 5
    maintenanceMarginFractionBPS: 1000, // MMF = 1%
    maxProfitRateBPS: 25000, // 250%
    assetClass: assetClasses.crypto,
    allowIncreasePosition: true,
    active: true,
    fundingRate: {
      maxSkewScaleUSD: ethers.utils.parseUnits(String(200_000_000), 30), // 3000 M
      maxFundingRate: ethers.utils.parseUnits("8", 18), // 800% per day
    },
    isAdaptiveFeeEnabled: true,
  },
  {
    marketIndex: 17,
    assetId: ethers.utils.formatBytes32String("UNI"),
    maxLongPositionSize: ethers.utils.parseUnits(String(150_000), 30),
    maxShortPositionSize: ethers.utils.parseUnits(String(150_000), 30),
    increasePositionFeeRateBPS: 5, // 0.05%
    decreasePositionFeeRateBPS: 5, // 0.05%
    initialMarginFractionBPS: 2000, // IMF = 20%, Max leverage = 5
    maintenanceMarginFractionBPS: 1000, // MMF = 1%
    maxProfitRateBPS: 25000, // 250%
    assetClass: assetClasses.crypto,
    allowIncreasePosition: true,
    active: true,
    fundingRate: {
      maxSkewScaleUSD: ethers.utils.parseUnits(String(200_000_000), 30), // 3000 M
      maxFundingRate: ethers.utils.parseUnits("8", 18), // 800% per day
    },
    isAdaptiveFeeEnabled: true,
  },
  {
    marketIndex: 18,
    assetId: ethers.utils.formatBytes32String("PEPE"),
    maxLongPositionSize: ethers.utils.parseUnits(String(150_000), 30),
    maxShortPositionSize: ethers.utils.parseUnits(String(150_000), 30),
    increasePositionFeeRateBPS: 5, // 0.05%
    decreasePositionFeeRateBPS: 5, // 0.05%
    initialMarginFractionBPS: 2000, // IMF = 20%, Max leverage = 5
    maintenanceMarginFractionBPS: 1000, // MMF = 1%
    maxProfitRateBPS: 25000, // 250%
    assetClass: assetClasses.crypto,
    allowIncreasePosition: true,
    active: true,
    fundingRate: {
      maxSkewScaleUSD: ethers.utils.parseUnits(String(200_000_000), 30), // 3000 M
      maxFundingRate: ethers.utils.parseUnits("8", 18), // 800% per day
    },
    isAdaptiveFeeEnabled: true,
  },
  {
    marketIndex: 19,
    assetId: ethers.utils.formatBytes32String("HYPE"),
    maxLongPositionSize: ethers.utils.parseUnits(String(150_000), 30),
    maxShortPositionSize: ethers.utils.parseUnits(String(150_000), 30),
    increasePositionFeeRateBPS: 8, // 0.08%
    decreasePositionFeeRateBPS: 8, // 0.08%
    initialMarginFractionBPS: 2000, // IMF = 20%, Max leverage = 5
    maintenanceMarginFractionBPS: 1000, // MMF = 1%
    maxProfitRateBPS: 25000, // 250%
    assetClass: assetClasses.crypto,
    allowIncreasePosition: true,
    active: true,
    fundingRate: {
      maxSkewScaleUSD: ethers.utils.parseUnits(String(200_000_000), 30), // 3000 M
      maxFundingRate: ethers.utils.parseUnits("8", 18), // 800% per day
    },
    isAdaptiveFeeEnabled: false,
  },
  {
    marketIndex: 20,
    assetId: ethers.utils.formatBytes32String("AERO"),
    maxLongPositionSize: ethers.utils.parseUnits(String(150_000), 30),
    maxShortPositionSize: ethers.utils.parseUnits(String(150_000), 30),
    increasePositionFeeRateBPS: 8, // 0.08%
    decreasePositionFeeRateBPS: 8, // 0.08%
    initialMarginFractionBPS: 2000, // IMF = 20%, Max leverage = 5
    maintenanceMarginFractionBPS: 1000, // MMF = 1%
    maxProfitRateBPS: 25000, // 250%
    assetClass: assetClasses.crypto,
    allowIncreasePosition: true,
    active: true,
    fundingRate: {
      maxSkewScaleUSD: ethers.utils.parseUnits(String(200_000_000), 30), // 3000 M
      maxFundingRate: ethers.utils.parseUnits("8", 18), // 800% per day
    },
    isAdaptiveFeeEnabled: false,
  },
  {
    marketIndex: 21,
    assetId: ethers.utils.formatBytes32String("BRETT"),
    maxLongPositionSize: ethers.utils.parseUnits(String(150_000), 30),
    maxShortPositionSize: ethers.utils.parseUnits(String(150_000), 30),
    increasePositionFeeRateBPS: 8, // 0.08%
    decreasePositionFeeRateBPS: 8, // 0.08%
    initialMarginFractionBPS: 2000, // IMF = 20%, Max leverage = 5
    maintenanceMarginFractionBPS: 1000, // MMF = 1%
    maxProfitRateBPS: 25000, // 250%
    assetClass: assetClasses.crypto,
    allowIncreasePosition: true,
    active: true,
    fundingRate: {
      maxSkewScaleUSD: ethers.utils.parseUnits(String(200_000_000), 30), // 3000 M
      maxFundingRate: ethers.utils.parseUnits("8", 18), // 800% per day
    },
    isAdaptiveFeeEnabled: false,
  },
  {
    marketIndex: 22,
    assetId: ethers.utils.formatBytes32String("XAU"),
    maxLongPositionSize: ethers.utils.parseUnits(String(100_000), 30),
    maxShortPositionSize: ethers.utils.parseUnits(String(100_000), 30),
    increasePositionFeeRateBPS: 5, // 0.05%
    decreasePositionFeeRateBPS: 5, // 0.05%
    initialMarginFractionBPS: 2000, // IMF = 20%, Max leverage = 5
    maintenanceMarginFractionBPS: 1000, // MMF = 1%
    maxProfitRateBPS: 25000, // 250%
    assetClass: assetClasses.commodities,
    allowIncreasePosition: true,
    active: true,
    fundingRate: {
      maxSkewScaleUSD: ethers.utils.parseUnits(String(10_000_000_000), 30), // 200 M
      maxFundingRate: ethers.utils.parseUnits("8", 18), // 800% per day
    },
    isAdaptiveFeeEnabled: false,
  },
  {
    marketIndex: 23,
    assetId: ethers.utils.formatBytes32String("USOIL"),
    maxLongPositionSize: ethers.utils.parseUnits(String(100_000), 30),
    maxShortPositionSize: ethers.utils.parseUnits(String(100_000), 30),
    increasePositionFeeRateBPS: 5, // 0.05%
    decreasePositionFeeRateBPS: 5, // 0.05%
    initialMarginFractionBPS: 2000, // IMF = 20%, Max leverage = 5
    maintenanceMarginFractionBPS: 1000, // MMF = 1%
    maxProfitRateBPS: 25000, // 250%
    assetClass: assetClasses.commodities,
    allowIncreasePosition: true,
    active: true,
    fundingRate: {
      maxSkewScaleUSD: ethers.utils.parseUnits(String(10_000_000_000), 30), // 200 M
      maxFundingRate: ethers.utils.parseUnits("8", 18), // 800% per day
    },
    isAdaptiveFeeEnabled: false,
  },
  {
    marketIndex: 24,
    assetId: ethers.utils.formatBytes32String("AAPL"),
    maxLongPositionSize: ethers.utils.parseUnits(String(100_000), 30),
    maxShortPositionSize: ethers.utils.parseUnits(String(100_000), 30),
    increasePositionFeeRateBPS: 5, // 0.05%
    decreasePositionFeeRateBPS: 5, // 0.05%
    initialMarginFractionBPS: 2000, // IMF = 20%, Max leverage = 5
    maintenanceMarginFractionBPS: 1000, // MMF = 1%
    maxProfitRateBPS: 25000, // 250%
    assetClass: assetClasses.equity,
    allowIncreasePosition: true,
    active: true,
    fundingRate: {
      maxSkewScaleUSD: ethers.utils.parseUnits(String(1_000_000_000), 30), // 200 M
      maxFundingRate: ethers.utils.parseUnits("8", 18), // 800% per day
    },
    isAdaptiveFeeEnabled: false,
  },
  {
    marketIndex: 25,
    assetId: ethers.utils.formatBytes32String("MSTR"),
    maxLongPositionSize: ethers.utils.parseUnits(String(100_000), 30),
    maxShortPositionSize: ethers.utils.parseUnits(String(100_000), 30),
    increasePositionFeeRateBPS: 5, // 0.05%
    decreasePositionFeeRateBPS: 5, // 0.05%
    initialMarginFractionBPS: 2000, // IMF = 20%, Max leverage = 5
    maintenanceMarginFractionBPS: 1000, // MMF = 1%
    maxProfitRateBPS: 25000, // 250%
    assetClass: assetClasses.equity,
    allowIncreasePosition: true,
    active: true,
    fundingRate: {
      maxSkewScaleUSD: ethers.utils.parseUnits(String(1_000_000_000), 30), // 200 M
      maxFundingRate: ethers.utils.parseUnits("8", 18), // 800% per day
    },
    isAdaptiveFeeEnabled: false,
  },
  {
    marketIndex: 26,
    assetId: ethers.utils.formatBytes32String("TSLA"),
    maxLongPositionSize: ethers.utils.parseUnits(String(100_000), 30),
    maxShortPositionSize: ethers.utils.parseUnits(String(100_000), 30),
    increasePositionFeeRateBPS: 5, // 0.05%
    decreasePositionFeeRateBPS: 5, // 0.05%
    initialMarginFractionBPS: 2000, // IMF = 20%, Max leverage = 5
    maintenanceMarginFractionBPS: 1000, // MMF = 1%
    maxProfitRateBPS: 25000, // 250%
    assetClass: assetClasses.equity,
    allowIncreasePosition: true,
    active: true,
    fundingRate: {
      maxSkewScaleUSD: ethers.utils.parseUnits(String(1_000_000_000), 30), // 200 M
      maxFundingRate: ethers.utils.parseUnits("8", 18), // 800% per day
    },
    isAdaptiveFeeEnabled: false,
  },
  {
    marketIndex: 27,
    assetId: ethers.utils.formatBytes32String("NVDA"),
    maxLongPositionSize: ethers.utils.parseUnits(String(100_000), 30),
    maxShortPositionSize: ethers.utils.parseUnits(String(100_000), 30),
    increasePositionFeeRateBPS: 5, // 0.05%
    decreasePositionFeeRateBPS: 5, // 0.05%
    initialMarginFractionBPS: 2000, // IMF = 20%, Max leverage = 5
    maintenanceMarginFractionBPS: 1000, // MMF = 1%
    maxProfitRateBPS: 25000, // 250%
    assetClass: assetClasses.equity,
    allowIncreasePosition: true,
    active: true,
    fundingRate: {
      maxSkewScaleUSD: ethers.utils.parseUnits(String(1_000_000_000), 30), // 200 M
      maxFundingRate: ethers.utils.parseUnits("8", 18), // 800% per day
    },
    isAdaptiveFeeEnabled: false,
  },



]