import { ethers } from "ethers";
import { ConfigStorage__factory } from "../../../../typechain";
import { loadConfig } from "../../utils/config";
import { passChainArg } from "../../utils/main-fn-wrappers";
import signers from "../../entities/signers";
import assetClasses from "../../entities/asset-classes";
import chalk from "chalk";

interface AssetClassConfig {
  baseBorrowingRate: ethers.BigNumber;
}

async function main(chainId: number) {
  const INPUTS = [
    {
      assetClass: assetClasses.crypto,
      assetConfig: {
        baseBorrowingRate: ethers.utils.parseEther("0.00005").div(60).div(60), // 0.01% per hour
      },
    },
    {
      assetClass: assetClasses.equity,
      assetConfig: {
        baseBorrowingRate: ethers.utils.parseEther("0.00005").div(60).div(60), // 0.01% per hour
      },
    },
    {
      assetClass: assetClasses.forex,
      assetConfig: {
        baseBorrowingRate: ethers.utils.parseEther("0.00005").div(60).div(60), // 0.01% per hour
      },
    },
    {
      assetClass: assetClasses.commodities,
      assetConfig: {
        baseBorrowingRate: ethers.utils.parseEther("0.00005").div(60).div(60), // 0.01% per hour
      },
    },
  ];

  console.group('[configs/ConfigStorage]');

  const config = loadConfig(chainId);
  const deployer = await signers.deployer(chainId);
  const configStorage = ConfigStorage__factory.connect(config.storages.config, deployer);

  // Get current configs
  const currentConfigs = await Promise.all(
    INPUTS.map((_, index) => configStorage.getAssetClassConfigByIndex(index))
  );

  // Prepare table data
  const tableData = INPUTS.map((input, index) => {
    const currentConfig = currentConfigs[index];
    const currentRate = currentConfig.baseBorrowingRate;
    const newRate = input.assetConfig.baseBorrowingRate;
    
    return {
      Index: index,
      AssetClass: input.assetClass,
      "Current Rate": ethers.utils.formatEther(currentRate.mul(60).mul(60)) + "%/hour",
      "New Rate": ethers.utils.formatEther(newRate.mul(60).mul(60)) + "%/hour",
      "Current Value": currentRate.toString(),
      "New Value": newRate.toString(),
      "Compare": currentRate.toString() !== newRate.toString() ? "🔄" : "✅"
    };
  });

  console.table(tableData);

  // Check if any changes are needed
  const changesNeeded = tableData.some(row => {
    const currentConfig = currentConfigs[row.Index];
    const newConfig = INPUTS[row.Index].assetConfig;
    return currentConfig.baseBorrowingRate.toString() !== newConfig.baseBorrowingRate.toString();
  });
  
  if (!changesNeeded) {
    console.log(chalk.green("No changes needed. Skipping updates."));
    console.groupEnd();
    return;
  }

  // Apply changes
  for (const row of tableData) {
    const currentConfig = currentConfigs[row.Index];
    const newConfig = INPUTS[row.Index].assetConfig;
    
    if (currentConfig.baseBorrowingRate.toString() !== newConfig.baseBorrowingRate.toString()) {
      console.log(`[Configs/ConfigStorage] Set Asset Class Config: [${row.Index}] ${INPUTS[row.Index].assetClass}`);
      console.log(`[Configs/ConfigStorage] Asset Config: ${JSON.stringify(newConfig)}`);
      const tx = await configStorage.setAssetClassConfigByIndex(row.Index, newConfig);
      console.log(`[Configs/ConfigStorage] Proposed Hash: ${tx}`);
    }
  }
  
  console.groupEnd();
}

passChainArg(main);