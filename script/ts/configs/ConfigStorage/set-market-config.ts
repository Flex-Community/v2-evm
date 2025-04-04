import { BigNumber, ethers } from "ethers";
import { ConfigStorage__factory, TradeHelper__factory } from "../../../../typechain";
import { loadConfig } from "../../utils/config";
import { Command } from "commander";
import chalk from 'chalk';
import signers from "../../entities/signers";
import { passChainArg } from "../../utils/main-fn-wrappers";
import { OwnerWrapper } from "../../wrappers/OwnerWrapper";
import {
  ConfigStorageMarketConfig,
  getMarketConfigForSet
} from "./configs/market-config";
import { fetchFeeData } from "wagmi/actions";



async function main(chainId: number) {
  const config = loadConfig(chainId);
  const deployer = await signers.deployer(chainId);

  const marketConfigs: Array<ConfigStorageMarketConfig> = await getMarketConfigForSet(chainId);

  const configStorage = ConfigStorage__factory.connect(config.storages.config, deployer);
  const ownerWrapper = new OwnerWrapper(chainId, deployer);

  const configStorageMarketConfigsLength = await configStorage.getMarketConfigsLength();
  if (configStorageMarketConfigsLength.toNumber() !== marketConfigs.length) {
    throw new Error(`Market config Error: Market configs length mismatch. Expected ${marketConfigs.length} but contract has ${configStorageMarketConfigsLength}. Use add-market-config.ts to add-market-configs script.`);
  }

  // console.log("[ConfigStorage] Setting market config...");
  for (let i = 0; i < marketConfigs.length; i++) {
    console.group(
      `[ConfigStorage] [${i}] --------- Setting ${ethers.utils.parseBytes32String(marketConfigs[i].assetId)} [${i}] market config...`
    );
    
    let existingMarketConfig:any = await configStorage.marketConfigs(marketConfigs[i].marketIndex)
    existingMarketConfig = {
      ...existingMarketConfig,
      marketIndex: marketConfigs[i].marketIndex,
      isAdaptiveFeeEnabled: await configStorage.isAdaptiveFeeEnabledByMarketIndex(marketConfigs[i].marketIndex),
    }
    if (existingMarketConfig.assetId !== marketConfigs[i].assetId) {
      console.log(`marketIndex ${marketConfigs[i].marketIndex} wrong asset id`);
      throw "bad asset id";
    }
    // console.log("existingMarketConfig: --------------------");
    // console.log(JSON.stringify(existingMarketConfig, null, 2));
    // console.log("newMarketConfig: --------------------");
    // console.log(JSON.stringify(marketConfigs[i], null, 2));

    function compareConfigs(existingConfig:any, newConfig:any):any {
      const differences:any = [];

      function compareValues(key:any, existingValue:any, newValue:any) {
        if (existingValue !== newValue) {
          differences.push({
            key,
            existingValue,
            newValue,
          });
        }
      }

      function compareObjects(existingObj:any, newObj:any, parentKey = '') {
        for (const key in newObj) {
          const fullKey = parentKey ? `${parentKey}.${key}` : key;
          if (typeof newObj[key] === 'object' && newObj[key] !== null) {
            compareObjects(existingObj[key], newObj[key], fullKey);
          } else {
            compareValues(fullKey, existingObj[key], newObj[key]);
          }
        }
      }

      compareObjects(existingConfig, newConfig);

      return differences;
    }

    const differences = compareConfigs(existingMarketConfig, marketConfigs[i]);

    if (differences.length > 0) {
      console.log(chalk.red(`[${i}] Differences found:`));
      differences.forEach((diff:any) => {
        console.log(
          `${chalk.yellow(diff.key)}: ${chalk.red(diff.existingValue)} -> ${chalk.green(diff.newValue)}`
        );
        if (String(diff.existingValue).startsWith('0x')) {
          console.log(`  ${BigNumber.from(diff.existingValue).toString()} -> ${BigNumber.from(diff.newValue).toString()}`);
        }
      });

      const tx = await ownerWrapper.authExec(
        configStorage.address,
        configStorage.interface.encodeFunctionData("setMarketConfig", [
          marketConfigs[i].marketIndex,
          marketConfigs[i],
          marketConfigs[i].isAdaptiveFeeEnabled,
        ])
      );
      console.log(`[ConfigStorage] Tx: ${tx}`);

    } else {
      console.log(chalk.green(`[${i}] No differences found.`));
    }

    // console.log(`Update Borrowing/Funding fees: ${tx}`);
    // await ownerWrapper.authExec(
    //   tradeHelper.address,
    //   tradeHelper.interface.encodeFunctionData("updateBorrowingRate", [marketConfigs[i].assetClass])
    // );
    // await ownerWrapper.authExec(
    //   tradeHelper.address,
    //   tradeHelper.interface.encodeFunctionData("updateFundingRate", [marketConfigs[i].marketIndex])
    // );
    console.groupEnd()
  }
  console.log("[ConfigStorage] Finished");
}

passChainArg(main);