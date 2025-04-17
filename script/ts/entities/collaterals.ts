import { ethers } from "ethers";

type CollateralEntity = {
  assetId: string;
  address: string;
  decimals: number;
};

export const baseMainnetCollaterals = {
  "USDC": {
    assetId: "0x5553444300000000000000000000000000000000000000000000000000000000",
    address: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
    decimals: 6,
  },
  "WBTC": {
    assetId: "0x4254430000000000000000000000000000000000000000000000000000000000",
    address: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
    decimals: 8,
  },
  "WETH": {
    assetId: "0x4554480000000000000000000000000000000000000000000000000000000000",
    address: "0x4200000000000000000000000000000000000006",
    decimals: 18,
  },
} as { [collateralSymbol: string]: CollateralEntity };

export default {
  "USDC.e": {
    assetId: ethers.utils.formatBytes32String("USDC"),
    address: "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8",
    decimals: 6,
  },
  USDT: {
    assetId: ethers.utils.formatBytes32String("USDT"),
    address: "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",
    decimals: 6,
  },
  DAI: {
    assetId: ethers.utils.formatBytes32String("DAI"),
    address: "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1",
    decimals: 18,
  },
  WETH: {
    assetId: ethers.utils.formatBytes32String("ETH"),
    address: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
    decimals: 18,
  },
  WBTC: {
    assetId: ethers.utils.formatBytes32String("BTC"),
    address: "0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f",
    decimals: 8,
  },
  sGLP: {
    assetId: ethers.utils.formatBytes32String("GLP"),
    address: "0x5402B5F40310bDED796c7D0F3FF6683f5C0cFfdf",
    decimals: 18,
  },
  ARB: {
    assetId: ethers.utils.formatBytes32String("ARB"),
    address: "0x912CE59144191C1204E64559FE8253a0e49E6548",
    decimals: 18,
  },
  wstETH: {
    assetId: ethers.utils.formatBytes32String("wstETH"),
    address: "0x5979d7b546e38e414f7e9822514be443a4800529",
    decimals: 18,
  },
  USDC: {
    assetId: ethers.utils.formatBytes32String("USDC"),
    address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    decimals: 6,
  },
  gmBTCUSDC: {
    assetId: ethers.utils.formatBytes32String("GM-BTCUSD"),
    address: "0x47c031236e19d024b42f8AE6780E44A573170703",
    decimals: 18,
  },
  gmETHUSDC: {
    assetId: ethers.utils.formatBytes32String("GM-ETHUSD"),
    address: "0x70d95587d40A2caf56bd97485aB3Eec10Bee6336",
    decimals: 18,
  },
} as { [collateralSymbol: string]: CollateralEntity };
