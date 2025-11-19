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

async function getCurrentLimits(contract: any, marketIndex: number): Promise<{ positionSizeLimit: string; tradeSizeLimit: string }> {
  try {
    const positionSizeLimit = await contract.positionSizeLimitOf(marketIndex);
    const tradeSizeLimit = await contract.tradeSizeLimitOf(marketIndex);
    return {
      positionSizeLimit: ethers.utils.formatUnits(positionSizeLimit, 30),
      tradeSizeLimit: ethers.utils.formatUnits(tradeSizeLimit, 30)
    };
  } catch (error) {
    return {
      positionSizeLimit: "error",
      tradeSizeLimit: "error"
    };
  }
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
  
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Get current limits and prepare table data
  type TableDataItem = {
    marketIndex: number;
    market: string;
    "TradeOrder Pos": string;
    "LimitTrade Pos": string;
    "TradeOrder Trade": string;
    "LimitTrade Trade": string;
    newPositionSizeLimit: number;
    newTradeSizeLimit: number;
  };
  
  const tableData: TableDataItem[] = [];
  for (const i of inputs) {
    const tradeOrderLimits = await getCurrentLimits(tradeOrderHelper, i.marketIndex);
    await sleep(250);
    const limitTradeLimits = await getCurrentLimits(limitTradeHelper, i.marketIndex);
    await sleep(250);
    
    console.log(`Processed market ${i.marketIndex} (${marketConfig.markets[i.marketIndex].name}) - ${tableData.length + 1}/${inputs.length}`);
    
    tableData.push({
      marketIndex: i.marketIndex,
      market: marketConfig.markets[i.marketIndex].name!,
      "TradeOrder Pos": colorize(tradeOrderLimits.positionSizeLimit, i.positionSizeLimit.toString()),
      "LimitTrade Pos": colorize(limitTradeLimits.positionSizeLimit, i.positionSizeLimit.toString()),
      "TradeOrder Trade": colorize(tradeOrderLimits.tradeSizeLimit, i.tradeSizeLimit.toString()),
      "LimitTrade Trade": colorize(limitTradeLimits.tradeSizeLimit, i.tradeSizeLimit.toString()),
      newPositionSizeLimit: i.positionSizeLimit,
      newTradeSizeLimit: i.tradeSizeLimit,
    });
  }

  console.table(tableData);

  // Check if changes are needed for each contract
  let tradeOrderChangesNeeded = false;
  let limitTradeChangesNeeded = false;

  for (const item of tableData) {
    const tradeOrderLimits = {
      positionSizeLimit: item["TradeOrder Pos"].replace(/[✅🔴]/g, '').trim(),
      tradeSizeLimit: item["TradeOrder Trade"].replace(/[✅🔴]/g, '').trim()
    };
    const limitTradeLimits = {
      positionSizeLimit: item["LimitTrade Pos"].replace(/[✅🔴]/g, '').trim(),
      tradeSizeLimit: item["LimitTrade Trade"].replace(/[✅🔴]/g, '').trim()
    };

    if (parseFloat(tradeOrderLimits.positionSizeLimit || "0") !== item.newPositionSizeLimit ||
        parseFloat(tradeOrderLimits.tradeSizeLimit || "0") !== item.newTradeSizeLimit) {
      tradeOrderChangesNeeded = true;
    }

    if (parseFloat(limitTradeLimits.positionSizeLimit || "0") !== item.newPositionSizeLimit ||
        parseFloat(limitTradeLimits.tradeSizeLimit || "0") !== item.newTradeSizeLimit) {
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