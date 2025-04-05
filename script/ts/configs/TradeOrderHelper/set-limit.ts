import { Command } from "commander";
import { loadConfig, loadMarketConfig } from "../../utils/config";
import signers from "../../entities/signers";
import { OwnerWrapper } from "../../wrappers/OwnerWrapper";
import { TradeOrderHelper__factory } from "../../../../typechain";
import { ethers } from "ethers";
import { findChainByName } from "../../entities/chains";
import { passChainArg } from "../../utils/main-fn-wrappers";
import { SET_LIMITS_CONFIG } from "./set-limit.config";

async function main(chainId: number) {
  const inputs = SET_LIMITS_CONFIG

  const config = loadConfig(chainId);
  const marketConfig = loadMarketConfig(chainId);
  const deployer = await signers.deployer(chainId);
  console.log("Deployer:", await deployer.getAddress());
  const ownerWrapper = new OwnerWrapper(chainId, deployer);
  const limitTradeHelper = TradeOrderHelper__factory.connect(config.helpers.tradeOrder!, deployer);

  console.log(`[configs/TradeOrderHelper] Set Limit By Market Index...`);
  console.table(
    inputs.map((i) => {
      return {
        marketIndex: i.marketIndex,
        market: marketConfig.markets[i.marketIndex].name!,
        positionSizeLimit: i.positionSizeLimit,
        tradeSizeLimit: i.tradeSizeLimit,
      };
    })
  );

  await ownerWrapper.authExec(
    limitTradeHelper.address,
    limitTradeHelper.interface.encodeFunctionData("setLimit", [
      inputs.map((input) => input.marketIndex),
      inputs.map((input) => ethers.utils.parseUnits(input.positionSizeLimit.toString(), 30)),
      inputs.map((input) => ethers.utils.parseUnits(input.tradeSizeLimit.toString(), 30)),
    ])
  );
}

passChainArg(main);