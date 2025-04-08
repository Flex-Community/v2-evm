import { ethers } from "hardhat";
import {
  LimitTradeHandler__factory,
} from "../../../../typechain";
import { getConfig } from "../../utils/config";
import readlineSync from 'readline-sync';

const config = getConfig();
const parseUnits = ethers.utils.parseUnits;

async function main() {
  const deployer = (await ethers.getSigners())[0];

  console.log("> LimitTradeHandler: Checking current minExecutionFee...");
  const limitTradeHandler = LimitTradeHandler__factory.connect(config.handlers.limitTrade, deployer);
  
  const currentFee = await limitTradeHandler.minExecutionFee();
  const newFee = parseUnits("0.00003", 18); // Convert to wei
  
  console.log(`Current minExecutionFee: ${ethers.utils.formatEther(currentFee)} ETH (${currentFee.toString()} wei)`);
  console.log(`New minExecutionFee: ${ethers.utils.formatEther(newFee)} ETH (${newFee.toString()} wei)`);
  
  if (currentFee.eq(newFee)) {
    console.log("🟢 minExecutionFee is already set to the desired value");
    return;
  }

  const answer = readlineSync.question(`Do you want to change minExecutionFee from ${ethers.utils.formatEther(currentFee)} ETH to ${ethers.utils.formatEther(newFee)} ETH? (y/n): `);

  if (answer.toLowerCase() !== 'y') {
    console.log("Operation cancelled by user");
    return;
  }

  console.log("> LimitTradeHandler: Setting minExecutionFee...");
  await (await limitTradeHandler.setMinExecutionFee(newFee)).wait();
  console.log("> LimitTradeHandler: setMinExecutionFee success!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
