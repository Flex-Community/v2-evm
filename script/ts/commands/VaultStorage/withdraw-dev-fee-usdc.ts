import { Command } from "commander";
import { loadConfig } from "../../utils/config";
import signers from "../../entities/signers";
import { EcoPyth2__factory, VaultStorage__factory } from "../../../../typechain";
import chains, { findChainByName } from "../../entities/chains";
import { baseMainnetCollaterals } from "../../entities/collaterals";
import { ethers } from "ethers";
import * as readlineSync from "readline-sync";
import { OwnerWrapper } from "../../wrappers/OwnerWrapper";
import { PythEvmPriceStruct } from "../../entities/pyth";

interface DevFeeStats {
  symbol: string;
  devFee: string;
  "value, usd": string;
}

async function getDevFeeStatistics(
  vaultStorage: any,
  ecoPyth: any
): Promise<{ stats: DevFeeStats[]; totalValue: number }> {
  const stats = await Promise.all(
    Object.entries(baseMainnetCollaterals).map(async ([symbol, collateral]) => {
      const devFee = await vaultStorage.devFees(collateral.address);
      const price = await ecoPyth.getPriceUnsafe(collateral.assetId);
      const value = devFee.mul(price.price).div(1e8);
      return {
        symbol,
        devFee: ethers.utils.formatUnits(devFee, collateral.decimals),
        "value, usd": ethers.utils.formatUnits(value, collateral.decimals),
      };
    })
  );

  const totalValue = stats.reduce((acc, c) => {
    return acc + parseFloat(c["value, usd"]);
  }, 0);

  return { stats, totalValue };
}

async function main(chainName: string, to: string) {
  const chain = findChainByName(chainName);
  const config = loadConfig(chain.id);
  const signer = await signers.deployer(chain.id);
  const ownerWrapper = new OwnerWrapper(chain.id, signer);

  console.log(`[cmds/VaultStorage] Withdraw dev fee to ${to}...`);
  const vaultStorage = VaultStorage__factory.connect(config.storages.vault!, signer);
  const ecoPyth = EcoPyth2__factory.connect(config.oracles.ecoPyth2, signer);

  // Get and display statistics
  const { stats, totalValue } = await getDevFeeStatistics(vaultStorage, ecoPyth);
  console.table(stats);
  console.log(`Total dev fee in USD: ${totalValue}`);

  // Get USDC dev fee for withdrawal
  const usdcCollateral = baseMainnetCollaterals.USDC;
  const devFee = await vaultStorage.devFees(usdcCollateral.address);
  
  if (devFee.isZero()) {
    console.log("[cmds/VaultStorage] No dev fee available for USDC");
    return;
  }

  console.log(`Current USDC dev fee: ${ethers.utils.formatUnits(devFee, usdcCollateral.decimals)} USDC`);
  
  const confirm = readlineSync.question("Confirm to withdraw dev fee? (y/n): ");
  switch (confirm.toLowerCase()) {
    case "y":
      break;
    case "n":
      console.log("Withdraw dev fee cancelled!");
      return;
    default:
      console.log("Invalid input!");
      return;
  }

  await ownerWrapper.authExec(
    vaultStorage.address,
    vaultStorage.interface.encodeFunctionData("withdrawDevFee", [
      usdcCollateral.address,
      devFee,
      to,
    ])
  );

  console.log("[cmds/VaultStorage] Finished");
}

const program = new Command();

program.requiredOption("--chain <chain>", "chain name (e.g. base, base_sepolia)");
program.requiredOption("--to <address>", "recipient address");

const opts = program.parse(process.argv).opts();

main(opts.chain, opts.to)
  .then(() => {
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
