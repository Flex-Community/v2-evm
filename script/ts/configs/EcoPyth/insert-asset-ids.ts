import { ethers } from "ethers";
import { EcoPyth__factory } from "../../../../typechain";
import signers from "../../entities/signers";
import { loadConfig } from "../../utils/config";
import { Command } from "commander";
import { OwnerWrapper } from "../../wrappers/OwnerWrapper";
import { passChainArg } from "../../utils/main-fn-wrappers";
import * as readlineSync from "readline-sync";
import chalk from "chalk";

const ASSET_IDS = [
  ethers.utils.formatBytes32String("ETH"),
  ethers.utils.formatBytes32String("BTC"),
  ethers.utils.formatBytes32String("USDC"),
  ethers.utils.formatBytes32String("SOL"),
  ethers.utils.formatBytes32String("XRP"),
  ethers.utils.formatBytes32String("BNB"),
  ethers.utils.formatBytes32String("DOGE"),
  ethers.utils.formatBytes32String("TRX"),
  ethers.utils.formatBytes32String("ADA"),
  ethers.utils.formatBytes32String("TON"),
  ethers.utils.formatBytes32String("LINK"),
  ethers.utils.formatBytes32String("VIRTUAL"),
  ethers.utils.formatBytes32String("AVAX"),
  ethers.utils.formatBytes32String("HBAR"),
  ethers.utils.formatBytes32String("SUI"),
  ethers.utils.formatBytes32String("SHIB"),
  ethers.utils.formatBytes32String("AAVE"),
  ethers.utils.formatBytes32String("PENDLE"),
  ethers.utils.formatBytes32String("UNI"),
  ethers.utils.formatBytes32String("PEPE"),
  ethers.utils.formatBytes32String("HYPE"),
  ethers.utils.formatBytes32String("AERO"),
  ethers.utils.formatBytes32String("BRETT"),
];

interface AssetComparison {
  assetId: string;
  status: string;
  currentIndex: string | number;
  expectedIndex: number;
}

async function main(chainId: number) {
  const config = loadConfig(chainId);
  const deployer = await signers.deployer(chainId);
  const ownerWrapper = new OwnerWrapper(chainId, deployer);

  const ecoPyth = EcoPyth__factory.connect(config.oracles.ecoPyth2, deployer);
  
  // Get current asset IDs from contract
  console.log("[configs/EcoPyth] Loading current asset IDs...");
  const currentAssetIds = await ecoPyth.getAssetIds();
  
  // Create a map of current asset IDs and their indices
  const currentAssetMap = new Map<string, number>();
  for (const assetId of currentAssetIds) {
    const index = await ecoPyth.mapAssetIdToIndex(assetId);
    currentAssetMap.set(assetId, index.toNumber());
  }

  // Compare with our ASSET_IDS
  const comparisonTable: AssetComparison[] = [];
  const missingAssetIds: string[] = [];
  const mismatchedAssets: { assetId: string; currentIndex: number; expectedIndex: number }[] = [];

  for (let i = 0; i < ASSET_IDS.length; i++) {
    const assetId = ASSET_IDS[i];
    const currentIndex = currentAssetMap.get(assetId);
    const expectedIndex = i + 1; // +1 because indices in contract start from 1

    const status = currentIndex === undefined ? "Missing" : 
                  currentIndex === expectedIndex ? "OK" : "Mismatch";
    
    if (status === "Mismatch") {
      mismatchedAssets.push({
        assetId: ethers.utils.parseBytes32String(assetId),
        currentIndex: currentIndex!,
        expectedIndex
      });
    } else if (status === "Missing") {
      missingAssetIds.push(assetId);
    }

    comparisonTable.push({
      assetId: ethers.utils.parseBytes32String(assetId),
      status: status === "OK" ? "🟢 OK" : 
              status === "Missing" ? "🟡 Missing" : 
              "🔴 Mismatch",
      currentIndex: currentIndex || "N/A",
      expectedIndex: expectedIndex
    });
  }

  // Display comparison table
  console.log("\n[configs/EcoPyth] Asset ID Comparison:");
  console.table(comparisonTable.map(item => ({
    "Asset ID": item.assetId,
    "Status": item.status,
    "Current Index": item.currentIndex,
    "Expected Index": item.expectedIndex
  })));

  // Check for critical index mismatches first
  if (mismatchedAssets.length > 0) {
    console.log(chalk.red("\n[configs/EcoPyth] CRITICAL ERROR: Found index mismatches:"));
    mismatchedAssets.forEach(({ assetId, currentIndex, expectedIndex }) => {
      console.log(chalk.red(`  - ${assetId}: Current index ${currentIndex}, Expected index ${expectedIndex}`));
    });
    console.log(chalk.red("\n[configs/EcoPyth] Please fix index mismatches before proceeding!"));
    process.exit(1);
  }

  // Handle missing assets if any
  if (missingAssetIds.length > 0) {
    console.log(chalk.yellow(`\n[configs/EcoPyth] Found ${missingAssetIds.length} missing asset IDs`));
    
    console.log("\n[configs/EcoPyth] Will add the following asset IDs:");
    missingAssetIds.forEach((assetId, index) => {
      console.log(`${ethers.utils.parseBytes32String(assetId)} (${assetId})`);
    });

    const finalConfirm = readlineSync.question("\n[configs/EcoPyth] Confirm transaction with these values? (y/n): ");
    if (finalConfirm.toLowerCase() !== 'y') {
      console.log("[configs/EcoPyth] Operation cancelled.");
      return;
    }

    console.log("[configs/EcoPyth] Inserting missing asset IDs...");
    await ownerWrapper.authExec(
      ecoPyth.address,
      ecoPyth.interface.encodeFunctionData("insertAssetIds", [missingAssetIds])
    );
    console.log(chalk.green("[configs/EcoPyth] Successfully inserted missing asset IDs!"));
  } else {
    console.log(chalk.green("\n[configs/EcoPyth] All asset IDs are correctly configured!"));
  }
}

passChainArg(main);