import { BotHandler__factory, ConfigStorage__factory, PerpStorage__factory, OwnableUpgradeable__factory } from "../../../../typechain";
import { ecoPythPriceFeedIdsByIndex } from "../../constants/eco-pyth-index";
import * as readlineSync from "readline-sync";
import { loadConfig } from "../../utils/config";
import { getUpdatePriceData } from "../../utils/price";
import signers from "../../entities/signers";
import { passChainArg } from "../../utils/main-fn-wrappers";
import { ethers } from "ethers";

const CHUNK_SIZE = 5;

async function main(chainId: number) {
  const config = loadConfig(chainId);
  const deployer = await signers.deployer(chainId);
  const deployerAddress = await deployer.getAddress();
  const botHandler = BotHandler__factory.connect(config.handlers.bot, deployer);
  const perpStorage = PerpStorage__factory.connect(config.storages.perp, deployer);
  const configStorage = ConfigStorage__factory.connect(config.storages.config, deployer);

  const isPositionManager = await botHandler.positionManagers(deployerAddress);
  if (!isPositionManager) {
    const grantAnswer = readlineSync.question(
      "[cmds/BotHandler] Deployer is not a position manager. Grant position manager to deployer? (y/n): "
    );
    if (grantAnswer.toLowerCase() !== "y" && grantAnswer.toLowerCase() !== "yes") {
      console.log("Aborted.");
      return;
    }
    await (await botHandler.setPositionManagers([deployerAddress], true)).wait(2);
  }

  console.log("[cmds/BotHandler] Fetching all active positions...\n");

  const allPositions: Array<{
    primaryAccount: string;
    subAccountId: number;
    marketIndex: number;
    positionSizeE30: ethers.BigNumber;
  }> = [];
  const limit = 500;
  let offset = 0;
  for (;;) {
    const chunk = await perpStorage.getActivePositions(limit, offset);
    if (chunk.length === 0) break;
    for (const p of chunk) {
      allPositions.push({
        primaryAccount: p.primaryAccount,
        subAccountId: p.subAccountId,
        marketIndex: p.marketIndex.toNumber(),
        positionSizeE30: p.positionSizeE30.abs(),
      });
    }
    offset += chunk.length;
    if (chunk.length < limit) break;
  }

  const marketConfigsLength = (await configStorage.getMarketConfigsLength()).toNumber();
  const marketActiveByIndex: Record<number, boolean> = {};
  for (const p of allPositions) {
    if (p.marketIndex in marketActiveByIndex) continue;
    if (p.marketIndex >= marketConfigsLength) {
      marketActiveByIndex[p.marketIndex] = false;
      continue;
    }
    try {
      const mc = await configStorage.getMarketConfigByIndex(p.marketIndex);
      marketActiveByIndex[p.marketIndex] = mc.active;
    } catch {
      marketActiveByIndex[p.marketIndex] = false;
    }
  }

  const tableData = allPositions.map((p, i) => ({
    account: p.primaryAccount,
    subId: p.subAccountId,
    marketIndex: p.marketIndex,
    sizeE30: ethers.utils.formatUnits(p.positionSizeE30, 30),
    marketActive: marketActiveByIndex[p.marketIndex] ? "active" : "delisted",
  }));

  if (tableData.length === 0) {
    console.log("No open positions.");
    return;
  }

  console.table(tableData);
  console.log(`Total open positions: ${allPositions.length}\n`);

  const delistedPositions = allPositions.filter((p) => !marketActiveByIndex[p.marketIndex]);
  if (delistedPositions.length === 0) {
    console.log("No positions on delisted markets. Nothing to close.");
    return;
  }

  console.log(`Positions on delisted markets: ${delistedPositions.length}`);
  const toClose = delistedPositions.map((p) => ({
    account: p.primaryAccount,
    subAccountId: p.subAccountId,
    marketIndex: p.marketIndex,
    tpToken: config.tokens.usdc,
  }));

  const confirmAnswer = readlineSync.question(
    `[cmds/BotHandler] Close ${toClose.length} position(s) on delisted markets via closeDelistedMarketPositions? (y/n): `
  );
  if (confirmAnswer.toLowerCase() !== "y" && confirmAnswer.toLowerCase() !== "yes") {
    console.log("Aborted.");
    return;
  }

  const iterations = Math.ceil(toClose.length / CHUNK_SIZE);
  for (let i = 0; i < iterations; i++) {
    const spliced = toClose.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
    const [_, minPublishedTime, priceUpdateData, publishTimeDiffUpdateData, hashedVaas] =
      await getUpdatePriceData(ecoPythPriceFeedIdsByIndex, deployer, chainId);

    const tx = await (
      await botHandler.closeDelistedMarketPositions(
        spliced.map((each) => each.account),
        spliced.map((each) => each.subAccountId),
        spliced.map((each) => each.marketIndex),
        spliced.map((each) => each.tpToken),
        priceUpdateData,
        publishTimeDiffUpdateData,
        minPublishedTime,
        hashedVaas
      )
    ).wait(2);

    console.log(`[cmds/BotHandler] Chunk ${i + 1}/${iterations} done: ${tx.transactionHash}`);
  }

  console.log("[cmds/BotHandler] Close delisted positions success!");
}

passChainArg(main);
