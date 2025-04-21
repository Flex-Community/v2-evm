import { BigNumber, ethers } from "ethers";
import { ConfigStorage__factory } from "../../../../typechain";
import { loadConfig } from "../../utils/config";
import chalk from 'chalk';
import signers from "../../entities/signers";
import { passChainArg } from "../../utils/main-fn-wrappers";
import { OwnerWrapper } from "../../wrappers/OwnerWrapper";

const liquidityConfig = {
  depositFeeRateBPS: 0, // 0%
  withdrawFeeRateBPS: 30, // 0.3%
  maxHLPUtilizationBPS: 7000, // 70%
  hlpTotalTokenWeight: 0, // DEFAULT, auto calculated by assetHlpTokenConfigs
  hlpSafetyBufferBPS: 2000, // 20%
  taxFeeRateBPS: 50, // 0.5%
  flashLoanFeeRateBPS: 0,
  dynamicFeeEnabled: true,
  enabled: true,
};

async function main(chainId: number) {
  const config = loadConfig(chainId);
  const deployer = await signers.deployer(chainId);
  const ownerWrapper = new OwnerWrapper(chainId, deployer);
  const configStorage = ConfigStorage__factory.connect(config.storages.config, deployer);

  console.log("[configs/ConfigStorage] Checking Liquidity Config...");

  // Get current liquidity config from contract
  const existingLiquidityConfig = await configStorage.getLiquidityConfig();

  function compareConfigs(existingConfig: any, newConfig: any): any {
    const differences: any = [];

    function compareValues(key: string, existingValue: any, newValue: any) {
      if (existingValue !== newValue) {
        differences.push({
          key,
          existingValue,
          newValue,
        });
      }
    }

    function compareObjects(existingObj: any, newObj: any, parentKey = '') {
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

  const differences = compareConfigs(existingLiquidityConfig, liquidityConfig);

  if (differences.length > 0) {
    console.log(chalk.red(`Differences found:`));
    differences.forEach((diff: any) => {
      console.log(
        `${chalk.yellow(diff.key)}: ${chalk.red(diff.existingValue)} -> ${chalk.green(diff.newValue)}`
      );
      if (String(diff.existingValue).startsWith('0x')) {
        console.log(`  ${BigNumber.from(diff.existingValue).toString()} -> ${BigNumber.from(diff.newValue).toString()}`);
      }
    });

    console.log("[configs/ConfigStorage] Set Liquidity Config...");
    const tx = await ownerWrapper.authExec(
      configStorage.address,
      configStorage.interface.encodeFunctionData("setLiquidityConfig", [liquidityConfig])
    );
  } else {
    console.log(chalk.green(`No differences found. Skipping update.`));
  }
}

passChainArg(main)