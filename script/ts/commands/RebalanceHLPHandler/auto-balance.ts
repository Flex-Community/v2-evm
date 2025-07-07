import { Command } from "commander";
import { loadConfig } from "../../utils/config";
import signers from "../../entities/signers";
import { ERC20__factory, RebalanceHLPHandler__factory, VaultStorage__factory, ConfigStorage__factory, Calculator__factory, OracleMiddleware__factory } from "../../../../typechain";
import { getUpdatePriceData } from "../../utils/price";
import { ecoPythPriceFeedIdsByIndex, ecoPythHoomanReadableByIndex } from "../../constants/eco-pyth-index";
import chains from "../../entities/chains";
import * as readlineSync from "readline-sync";
import { ethers } from "ethers";
import { passChainArg } from "../../utils/main-fn-wrappers";

interface TokenInfo {
  address: string;
  symbol: string;
  decimals: number;
  currentBalanceRaw: ethers.BigNumber;
  currentValueUSD: ethers.BigNumber;
  currentPercentage: number;
  targetPercentage: number;
  targetValueUSD: ethers.BigNumber;
  difference: ethers.BigNumber; // positive = need more, negative = need less
}

const TARGET_PROPORTIONS = {
  WBTC: 0.40, // 40%
  USDC: 0.40, // 40%
  WETH: 0.20, // 20%
};

async function main(chainId: number) {
  const config = loadConfig(chainId);
  const chainInfo = chains[chainId];
  const deployer = await signers.deployer(chainId);

  // Connect to contracts
  const vaultStorage = VaultStorage__factory.connect(config.storages.vault, deployer);
  const configStorage = ConfigStorage__factory.connect(config.storages.config, deployer);
  const calculator = Calculator__factory.connect(config.calculator, deployer);
  const handler = RebalanceHLPHandler__factory.connect(config.handlers.rebalanceHLP, deployer);
  const oracle = OracleMiddleware__factory.connect(config.oracles.middleware, deployer);

  // Define token addresses
  const tokens = {
    wbtc: config.tokens.wbtc,
    usdc: config.tokens.usdc,
    weth: config.tokens.weth,
  };

  console.log("=== FLP Auto-Balance Script ===\n");
  console.log("Fetching current FLP token balances and values...\n");

  // Get total FLP value once (in USD, E30 format)
  const totalFLPValueUsd = await calculator.getHLPValueE30(false);
  console.log(`Total FLP Value: ${ethers.utils.formatUnits(totalFLPValueUsd, 30)} USD\n`);

  // Get current balances and values
  const tokenInfos: { [key: string]: TokenInfo } = {};
  let totalTokensValueUSD = ethers.BigNumber.from(0);

  for (const [symbol, address] of Object.entries(tokens)) {
    const tokenContract = ERC20__factory.connect(address, deployer);
    const [tokenSymbol, decimals, hlpLiquidity] = await Promise.all([
      tokenContract.symbol(),
      tokenContract.decimals(),
      vaultStorage.hlpLiquidity(address),
    ]);
    console.log(`${symbol} ${tokenSymbol} ${decimals}e10 ${hlpLiquidity}`);

    // Calculate USD value using the same logic as _getHLPUnderlyingAssetValueE30
    let valueUSD = ethers.BigNumber.from(0);
    
    if (hlpLiquidity.gt(0)) {
      try {
        // Get asset configuration for this token
        const assetConfig = await configStorage.getAssetConfigByToken(address);
        
        // Get total assets = hlpLiquidity + hlpLiquidityOnHold
        const hlpLiquidityOnHold = await vaultStorage.hlpLiquidityOnHold(address);
        const totalAssets = hlpLiquidity.add(hlpLiquidityOnHold);
        
        if (totalAssets.gt(0)) {
          // Get price from oracle (using false for min price like in the original method)
          const [priceE30] = await oracle.unsafeGetLatestPrice(assetConfig.assetId, false);
          
          // Calculate value = (totalAssets * priceE30) / (10 ** decimals)
          valueUSD = totalAssets.mul(priceE30).div(ethers.BigNumber.from(10).pow(assetConfig.decimals));
        }
      } catch (error) {
        console.warn(`Could not calculate value for ${symbol}: ${error}`);
        valueUSD = ethers.BigNumber.from(0);
      }
    }

    tokenInfos[symbol.toUpperCase()] = {
      address,
      symbol: tokenSymbol,
      decimals,
      currentBalanceRaw: hlpLiquidity,
      currentValueUSD: valueUSD,
      currentPercentage: 0, // Will calculate after getting total
      targetPercentage: TARGET_PROPORTIONS[symbol.toUpperCase() as keyof typeof TARGET_PROPORTIONS] || 0,
      targetValueUSD: ethers.BigNumber.from(0), // Will calculate after getting total
      difference: ethers.BigNumber.from(0), // Will calculate after getting total
    };

    totalTokensValueUSD = totalTokensValueUSD.add(valueUSD);
  }

  // Calculate percentages and differences
  for (const symbol of Object.keys(tokenInfos)) {
    const info = tokenInfos[symbol];
    info.currentPercentage = totalTokensValueUSD.gt(0) 
      ? parseFloat(ethers.utils.formatUnits(info.currentValueUSD.mul(10000).div(totalTokensValueUSD), 2))
      : 0;
    info.targetValueUSD = totalTokensValueUSD.mul(Math.floor(info.targetPercentage * 10000)).div(10000);
    info.difference = info.targetValueUSD.sub(info.currentValueUSD);
  }

  // Display current state
  console.log("📊 Current FLP Token Distribution:");
  const tableData = Object.entries(tokenInfos).map(([symbol, info]) => ({
    Token: symbol,
    Balance: ethers.utils.formatUnits(info.currentBalanceRaw, info.decimals),
    'USD Value': ethers.utils.formatUnits(info.currentValueUSD, 30),
    'Current %': info.currentPercentage.toFixed(2) + '%',
    'Target %': (info.targetPercentage * 100).toFixed(2) + '%',
    'Difference': (info.difference.gte(0) ? '+' : '-') + ethers.utils.formatUnits(info.difference.abs(), 30)
  }));

  console.table(tableData);
  console.log(`💰 Total Portfolio Value: ${ethers.utils.formatUnits(totalTokensValueUSD, 30)} USD`);
  console.log(`🏦 Total FLP Value: ${ethers.utils.formatUnits(totalFLPValueUsd, 30)} USD\n`);

  // Calculate required swaps
  const swapsNeeded: Array<{
    fromToken: string;
    toToken: string;
    fromAmount: ethers.BigNumber;
    estimatedToAmount: ethers.BigNumber;
    path: string[];
  }> = [];

  // Find tokens that need to be reduced (negative difference) with >1% threshold
  const surplus = Object.entries(tokenInfos).filter(([, info]) => {
    const percentageDiff = Math.abs(info.currentPercentage - (info.targetPercentage * 100));
    return info.difference.lt(0) && percentageDiff > 1.0;
  });
  
  // Find tokens that need to be increased (positive difference) with >1% threshold
  const deficit = Object.entries(tokenInfos).filter(([, info]) => {
    const percentageDiff = Math.abs(info.currentPercentage - (info.targetPercentage * 100));
    return info.difference.gt(0) && percentageDiff > 1.0;
  });

  console.log("🔄 Required Rebalancing Actions:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // Show tokens that are within 1% threshold (no rebalancing needed)
  const withinThreshold = Object.entries(tokenInfos).filter(([, info]) => {
    const percentageDiff = Math.abs(info.currentPercentage - (info.targetPercentage * 100));
    return percentageDiff <= 1.0;
  });

  if (withinThreshold.length > 0) {
    console.log("✅ Tokens within 1% threshold (no rebalancing needed):");
    withinThreshold.forEach(([symbol, info]) => {
      const percentageDiff = Math.abs(info.currentPercentage - (info.targetPercentage * 100));
      console.log(`   ${symbol}: ${info.currentPercentage.toFixed(2)}% → ${(info.targetPercentage * 100).toFixed(2)}% (diff: ${percentageDiff.toFixed(2)}%)`);
    });
    console.log("");
  }

  if (surplus.length === 0 && deficit.length === 0) {
    console.log("✅ Portfolio is already balanced within 1% threshold!");
    return;
  }

  // Enhanced rebalancing strategy: handle multiple surplus tokens to single deficit token
  console.log(`📊 Surplus tokens: ${surplus.length}, Deficit tokens: ${deficit.length}`);
  
  // If we have deficit tokens, allocate surplus to them
  if (deficit.length > 0) {
    // Sort deficit by largest need first
    const sortedDeficit = deficit.sort((a, b) => b[1].difference.sub(a[1].difference).gt(0) ? 1 : -1);
    
    // For each surplus token, create a swap to the largest deficit token
    for (const [fromSymbol, fromInfo] of surplus) {
      const [toSymbol, toInfo] = sortedDeficit[0]; // Use the largest deficit token
      
      const swapAmountUSD = fromInfo.difference.abs(); // How much USD to swap
      
      // Convert USD amount to token amount for fromToken
      // Formula: tokenAmount = (swapAmountUSD * currentBalanceRaw) / currentValueUSD
      const fromTokenAmount = swapAmountUSD.mul(fromInfo.currentBalanceRaw).div(fromInfo.currentValueUSD);

      console.log(`📤 Sell ${ethers.utils.formatUnits(fromTokenAmount, fromInfo.decimals)} ${fromSymbol}`);
      console.log(`📥 Buy  ~${ethers.utils.formatUnits(swapAmountUSD, 30)} USD worth of ${toSymbol}`);
      console.log(`💱 Path: ${fromSymbol} → ${toSymbol}`);
      console.log("");

      swapsNeeded.push({
        fromToken: fromSymbol,
        toToken: toSymbol,
        fromAmount: fromTokenAmount,
        estimatedToAmount: swapAmountUSD,
        path: [fromInfo.address, toInfo.address],
      });
      
      // Update deficit amount for next iteration
      sortedDeficit[0][1].difference = sortedDeficit[0][1].difference.sub(swapAmountUSD);
    }
  }

  if (swapsNeeded.length === 0) {
    console.log("✅ No swaps needed - portfolio is already balanced!");
    return;
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // Get price update data
  const [readableTable, minPublishedTime, priceUpdateData, publishTimeDiffUpdateData, hashedVaas] =
    await getUpdatePriceData(ecoPythPriceFeedIdsByIndex, chainInfo.jsonRpcProvider);
  
  // Filter to show only FLP tokens
  const flpTokenIndices = {
    weth: 0, // ETH - index 0
    wbtc: 1, // BTC - index 1
    usdc: 2, // USDC - index 2
  };
  
  const flpTokensReadableTable = readableTable.filter((row, index) => {
    const tokenName = ecoPythHoomanReadableByIndex[index];
    return Object.values(flpTokenIndices).includes(index) && 
           (tokenName === "ETH" || tokenName === "BTC" || tokenName === "USDC");
  });
  
  console.log("\n📈 Price Feed Data (FLP Tokens only):");
  console.table(flpTokensReadableTable);

  console.log("\n🚀 Executing rebalancing swaps...\n");

  // Execute swaps
  for (let i = 0; i < swapsNeeded.length; i++) {
    const swap = swapsNeeded[i];
    
    console.log(`\n[${i + 1}/${swapsNeeded.length}] Executing swap: ${swap.fromToken} → ${swap.toToken}`);
    console.log(`Amount: ${ethers.utils.formatUnits(swap.fromAmount, tokenInfos[swap.fromToken].decimals)} ${swap.fromToken}`);

    // Convert USD amount to token amount for toToken (minAmountOut)
    const toTokenInfo = tokenInfos[swap.toToken];
    const minAmountOutInTokens = swap.estimatedToAmount
      .mul(99).div(100) // 1% slippage tolerance
      .mul(ethers.BigNumber.from(10).pow(toTokenInfo.decimals))
      .div(ethers.BigNumber.from(10).pow(30)); // Convert from E30 to token decimals

    console.log(`📥 Expected to receive: ${ethers.utils.formatUnits(minAmountOutInTokens, toTokenInfo.decimals)} ${swap.toToken}`);
    console.log(`📊 Min amount out (with 1% slippage): ${ethers.utils.formatUnits(minAmountOutInTokens, toTokenInfo.decimals)} ${swap.toToken}`);

    const swapParams = {
      amountIn: swap.fromAmount,
      minAmountOut: minAmountOutInTokens,
      path: swap.path,
    };

    try {
      const tx = await handler.swap(
        swapParams,
        priceUpdateData,
        publishTimeDiffUpdateData,
        minPublishedTime,
        hashedVaas
      );
      
      console.log(`✅ Transaction sent: ${tx.hash}`);
      console.log("⏳ Waiting for confirmation...");
      
      const receipt = await tx.wait();
      console.log(`✅ Swap completed in block ${receipt.blockNumber}`);
      
    } catch (error) {
      console.error(`❌ Swap failed: ${error}`);
    }
  }

  console.log("\n🎉 Rebalancing completed!");
  console.log("📊 You can run the script again to check the new balance distribution.");
}

passChainArg(main); 