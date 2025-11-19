import { Calculator__factory } from "../../../../typechain";
import { loadConfig } from "../../utils/config";
import signers from "../../entities/signers";
import { OwnerWrapper } from "../../wrappers/OwnerWrapper";
import { passChainArg } from "../../utils/main-fn-wrappers";
import chalk from "chalk";

async function main(chainId: number) {
  const config = loadConfig(chainId);
  const deployer = await signers.deployer(chainId);
  const ownerWrapper = new OwnerWrapper(chainId, deployer);

  const calculator = Calculator__factory.connect(config.calculator, deployer);
  
  console.log(`[configs/Calculator] setTradeHelper`);
  
  const currentTradeHelper = await calculator.tradeHelper();
  const newTradeHelper = config.helpers.trade;
  
  console.log(chalk.yellow("Current trade helper:"), chalk.yellow(currentTradeHelper));
  console.log(chalk.green("New trade helper:"), chalk.green(newTradeHelper));
  
  if (currentTradeHelper.toLowerCase() === newTradeHelper.toLowerCase()) {
    console.log(chalk.green("✅ Trade helper value is already set to the desired value"));
    return;
  }
  
  await ownerWrapper.authExec(
    calculator.address,
    calculator.interface.encodeFunctionData("setTradeHelper", [newTradeHelper])
  );
  console.log("[configs/Calculator] Finished");
}

passChainArg(main)