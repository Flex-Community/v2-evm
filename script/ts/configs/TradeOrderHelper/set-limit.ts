import { Command } from "commander";
import { loadConfig, loadMarketConfig } from "../../utils/config";
import signers from "../../entities/signers";
import { OwnerWrapper } from "../../wrappers/OwnerWrapper";
import { TradeOrderHelper__factory, LimitTradeHelper__factory } from "../../../../typechain";
import { ethers } from "ethers";
import { findChainByName } from "../../entities/chains";
import { passChainArg } from "../../utils/main-fn-wrappers";
import { SET_LIMITS_CONFIG } from "./set-limit.config";

function colorize(value: string, newValue: string) {
  const parsedValue = parseFloat(value);
  const parsedNewValue = parseFloat(newValue);
  if (parsedValue === parsedNewValue) {
    return `✅ ${value}`;
  }
  return `🔴 ${value}`;
}

async function getCurrentLimits(contract: any, marketIndex: number) {
  const positionSizeLimit = await contract.positionSizeLimitOf(marketIndex);
  const tradeSizeLimit = await contract.tradeSizeLimitOf(marketIndex);
  return {
    positionSizeLimit: ethers.utils.formatUnits(positionSizeLimit, 30),
    tradeSizeLimit: ethers.utils.formatUnits(tradeSizeLimit, 30)
  };
}

async function main(chainId: number) {
  const inputs = SET_LIMITS_CONFIG

  const config = loadConfig(chainId);
  const marketConfig = loadMarketConfig(chainId);
  const deployer = await signers.deployer(chainId);
  console.log("Deployer:", await deployer.getAddress());
  const ownerWrapper = new OwnerWrapper(chainId, deployer);
  const tradeOrderHelper = TradeOrderHelper__factory.connect(config.helpers.tradeOrder!, deployer);
  const limitTradeHelper = LimitTradeHelper__factory.connect(config.helpers.limitTrade!, deployer);
  
  console.group("[configs/setLimits]");
  
  // Get current limits and prepare table data
  const tableData = await Promise.all(inputs.map(async (i) => {
    const [tradeOrderLimits, limitTradeLimits] = await Promise.all([
      getCurrentLimits(tradeOrderHelper, i.marketIndex),
      getCurrentLimits(limitTradeHelper, i.marketIndex)
    ]);
    
    return {
      marketIndex: i.marketIndex,
      market: marketConfig.markets[i.marketIndex].name!,
      "TradeOrder Pos": colorize(tradeOrderLimits.positionSizeLimit, i.positionSizeLimit.toString()),
      "LimitTrade Pos": colorize(limitTradeLimits.positionSizeLimit, i.positionSizeLimit.toString()),
      "TradeOrder Trade": colorize(tradeOrderLimits.tradeSizeLimit, i.tradeSizeLimit.toString()),
      "LimitTrade Trade": colorize(limitTradeLimits.tradeSizeLimit, i.tradeSizeLimit.toString()),
      newPositionSizeLimit: i.positionSizeLimit,
      newTradeSizeLimit: i.tradeSizeLimit,
    };
  }));

  console.table(tableData);

  // Check if changes are needed for each contract
  let tradeOrderChangesNeeded = false;
  let limitTradeChangesNeeded = false;

  for (const input of inputs) {
    const [tradeOrderLimits, limitTradeLimits] = await Promise.all([
      getCurrentLimits(tradeOrderHelper, input.marketIndex),
      getCurrentLimits(limitTradeHelper, input.marketIndex)
    ]);

    if (parseFloat(tradeOrderLimits.positionSizeLimit) !== input.positionSizeLimit ||
        parseFloat(tradeOrderLimits.tradeSizeLimit) !== input.tradeSizeLimit) {
      tradeOrderChangesNeeded = true;
    }

    if (parseFloat(limitTradeLimits.positionSizeLimit) !== input.positionSizeLimit ||
        parseFloat(limitTradeLimits.tradeSizeLimit) !== input.tradeSizeLimit) {
      limitTradeChangesNeeded = true;
    }
  }

  if (!tradeOrderChangesNeeded && !limitTradeChangesNeeded) {
    console.log("No changes needed - all values are already set correctly");
    console.groupEnd();
    return;
  }

  // Apply changes to contracts that need updates
  const marketIndexes = inputs.map((input) => input.marketIndex);
  const positionSizeLimits = inputs.map((input) => ethers.utils.parseUnits(input.positionSizeLimit.toString(), 30));
  const tradeSizeLimits = inputs.map((input) => ethers.utils.parseUnits(input.tradeSizeLimit.toString(), 30));

  if (tradeOrderChangesNeeded) {
    console.log("Applying changes to TradeOrderHelper...");
    await ownerWrapper.authExec(
      tradeOrderHelper.address,
      tradeOrderHelper.interface.encodeFunctionData("setLimit", [
        marketIndexes,
        positionSizeLimits,
        tradeSizeLimits,
      ])
    );
  } else {
    console.log("No changes needed for TradeOrderHelper");
  }

  if (limitTradeChangesNeeded) {
    console.log("Applying changes to LimitTradeHelper...");
    await ownerWrapper.authExec(
      limitTradeHelper.address,
      limitTradeHelper.interface.encodeFunctionData("setLimit", [
        marketIndexes,
        positionSizeLimits,
        tradeSizeLimits,
      ])
    );
  } else {
    console.log("No changes needed for LimitTradeHelper");
  }

  console.log("Changes applied successfully!");
  console.groupEnd();
}

passChainArg(main);