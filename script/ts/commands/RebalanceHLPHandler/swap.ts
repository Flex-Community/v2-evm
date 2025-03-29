import { Command } from "commander";
import { loadConfig } from "../../utils/config";
import signers from "../../entities/signers";
import { ERC20__factory, RebalanceHLPHandler__factory } from "../../../../typechain";
import { getUpdatePriceData } from "../../utils/price";
import { ecoPythPriceFeedIdsByIndex } from "../../constants/eco-pyth-index";
import chains from "../../entities/chains";
import * as readlineSync from "readline-sync";
import { ethers } from "ethers";
import { passChainArg } from "../../utils/main-fn-wrappers";

async function main(chainId: number) {
  const config = loadConfig(chainId);

  const amountIn = 400;
  const PARAMS = [
    // {
    //   amountIn: "1281586.724641214767559313",
    //   minAmountOut: "1354900",
    //   path: [config.tokens.sglp, config.tokens.usdc],
    // },
    {
      amountIn: String(amountIn),
      // minAmountOut: String(amountIn / 96532.7 * 0.99),
      minAmountOut: 0.00411253 * 0.995,
      path: [config.tokens.usdc, config.tokens.wbtc],
    },
  ];

  const chainInfo = chains[chainId];
  const deployer = await signers.deployer(chainId);

  const [readableTable, minPublishedTime, priceUpdateData, publishTimeDiffUpdateData, hashedVaas] =
    await getUpdatePriceData(ecoPythPriceFeedIdsByIndex, chainInfo.jsonRpcProvider);
  console.table(readableTable);
  const confirm = readlineSync.question("Confirm to update price feeds? (y/n): ");
  switch (confirm) {
    case "y":
      break;
    case "n":
      console.log("Feed Price cancelled!");
      return;
    default:
      console.log("Invalid input!");
      return;
  }

  const handler = RebalanceHLPHandler__factory.connect(config.handlers.rebalanceHLP, deployer);
  for (const p of PARAMS) {
    const path0Token = ERC20__factory.connect(p.path[0], deployer);
    const pathLastToken = ERC20__factory.connect(p.path[p.path.length - 1], deployer);

    console.log(`path0Token: ${path0Token.address}, pathLastToken: ${pathLastToken.address}`);

    const [path0Symbol, path0Decimals, pathLastSymbol, pathLastDecimals] = await Promise.all([
      path0Token.symbol(),
      path0Token.decimals(),
      pathLastToken.symbol(),
      pathLastToken.decimals(),
    ]);

    console.log(`Amount in: ${p.amountIn} * 10e${path0Decimals} ${path0Symbol}`, ethers.utils.parseUnits(p.amountIn, path0Decimals).toString());
    console.log(`Amount Out: ${p.minAmountOut} * 10e${pathLastDecimals} ${pathLastSymbol}`, ethers.utils.parseUnits(Number(p.minAmountOut).toFixed(pathLastDecimals), pathLastDecimals).toString());

    let params = {
      amountIn: ethers.utils.parseUnits(p.amountIn, path0Decimals),
      minAmountOut: ethers.utils.parseUnits(Number(p.minAmountOut).toFixed(pathLastDecimals), pathLastDecimals),
      path: p.path,
    };
    console.log(`[commands/RebalanceHLPHandler] Swapping from ${path0Symbol} to ${pathLastSymbol}...\n`, JSON.stringify(params, null, 2));
    const tx = await handler.swap(
      params,
      priceUpdateData,
      publishTimeDiffUpdateData,
      minPublishedTime,
      hashedVaas
    );
    console.log(`[commands/RebalanceHLPHandler] Tx: ${tx.hash}`);
  }
}
 passChainArg(main);