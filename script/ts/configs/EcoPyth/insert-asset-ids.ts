import { ethers } from "ethers";
import { EcoPyth__factory } from "../../../../typechain";
import signers from "../../entities/signers";
import { loadConfig } from "../../utils/config";
import { Command } from "commander";
import SafeWrapper from "../../wrappers/SafeWrapper";

const ASSET_IDS = [
  ethers.utils.formatBytes32String("AVAX"),
  ethers.utils.formatBytes32String("INJ"),
  ethers.utils.formatBytes32String("SHIB"),
  ethers.utils.formatBytes32String("DOT"),
  ethers.utils.formatBytes32String("SEI"),
  ethers.utils.formatBytes32String("ATOM"),
  ethers.utils.formatBytes32String("PEPE"),
];

async function main(chainId: number) {
  const deployer = signers.deployer(chainId);
  const config = loadConfig(chainId);
  const safeWrappar = new SafeWrapper(chainId, config.safe, deployer);

  const ecoPyth = EcoPyth__factory.connect(config.oracles.ecoPyth2, deployer);
  console.log("[configs/EcoPyth] Proposing inserting asset IDs...");
  await (await ecoPyth.insertAssetIds(ASSET_IDS)).wait();
}

const program = new Command();

program.requiredOption("--chain-id <chainId>", "chain id", parseInt);

const opts = program.parse(process.argv).opts();

main(opts.chainId).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
