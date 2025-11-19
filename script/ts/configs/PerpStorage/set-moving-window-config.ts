import { PerpStorage__factory } from "../../../../typechain";
import { loadConfig } from "../../utils/config";
import { Command } from "commander";
import signers from "../../entities/signers";
import { OwnerWrapper } from "../../wrappers/OwnerWrapper";
import { passChainArg } from "../../utils/main-fn-wrappers";
import chalk from "chalk";

async function main(chainId: number) {
  const config = loadConfig(chainId);
  const deployer = await signers.deployer(chainId);
  const ownerWrapper = new OwnerWrapper(chainId, deployer);

  const windowLength = 5; // 5 invervals per window
  const eachInterval = 60; // each interval is 1 minute

  const perpStorage = PerpStorage__factory.connect(config.storages.perp, deployer);
  
  // Get current values
  const currentWindowLength = await perpStorage.movingWindowLength();
  const currentInterval = await perpStorage.movingWindowInterval();

  console.log(`[configs/PerpStorage] Configuration:`);
  if (currentWindowLength.eq(windowLength)) {
    console.log(` movingWindowLength: ${chalk.green(windowLength.toString())}`);
  } else {
    console.log(` movingWindowLength: ${chalk.yellow(currentWindowLength.toString())} → ${chalk.yellow(windowLength.toString())}`);
  }

  if (currentInterval.eq(eachInterval)) {
    console.log(` movingWindowInterval: ${chalk.green(eachInterval.toString())}`);
  } else {
    console.log(` movingWindowInterval: ${chalk.yellow(currentInterval.toString())} → ${chalk.yellow(eachInterval.toString())}`);
  }

  console.log(`\n[configs/PerpStorage] Setting new configuration...`);
  await ownerWrapper.authExec(
    perpStorage.address,
    perpStorage.interface.encodeFunctionData("setMovingWindowConfig", [windowLength, eachInterval])
  );
  console.log("[configs/PerpStorage] Finished");
}

passChainArg(main);