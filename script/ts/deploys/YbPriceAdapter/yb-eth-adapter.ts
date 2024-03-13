import { ethers, run } from "hardhat";
import { loadConfig, writeConfigFile } from "../../utils/config";

async function main() {
  const deployer = (await ethers.getSigners())[0];
  const chainId = (await ethers.provider.getNetwork()).chainId;
  const config = loadConfig(chainId);
  const ybToken = config.tokens.ybeth2!;
  const assetId = ethers.utils.formatBytes32String("ETH");
  const contract = await ethers.deployContract("YbPriceAdapter", [ybToken, assetId], deployer);

  console.log(`[deploys/YbPriceAdapter] Deploying YbPriceAdapter for ybETH Contract`);
  await contract.deployed();
  console.log(`[deploys/YbPriceAdapter] Deployed at: ${contract.address}`);

  config.oracles.priceAdapters.ybeth2 = contract.address;
  writeConfigFile(config);

  await run("verify:verify", {
    address: contract.address,
    constructorArguments: [ybToken, assetId],
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});