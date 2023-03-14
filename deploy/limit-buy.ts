import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";
import {
  CrossMarginHandler__factory,
  ERC20__factory,
  IPyth__factory,
  LimitTradeHandler__factory,
  MarketTradeHandler__factory,
  TradeService__factory,
} from "../typechain";
import { getConfig } from "./utils/config";
import { getPriceData } from "./utils/pyth";

const BigNumber = ethers.BigNumber;
const config = getConfig();

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const deployer = (await ethers.getSigners())[0];

  const handler = LimitTradeHandler__factory.connect(config.handlers.limitTrade, deployer);
  // await (await handler.setMinExecutionFee(30)).wait();
  const executionFee = await handler.minExecutionFee();
  console.log("Limit Buy...");
  await (
    await handler.createOrder(
      0,
      0,
      ethers.utils.parseUnits("10", 30),
      ethers.utils.parseUnits("1550", 30),
      true,
      executionFee,
      true,
      config.tokens.usdc,
      { value: executionFee }
    )
  ).wait();
  console.log("Limit Buy Success!");
};

export default func;
func.tags = ["LimitBuy"];