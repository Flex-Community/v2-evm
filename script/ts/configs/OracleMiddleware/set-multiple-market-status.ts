import { ethers } from "hardhat";
import { OracleMiddleware__factory } from "../../../../typechain";
import { getConfig, loadConfig } from "../../utils/config";
import { passChainArg } from "../../utils/main-fn-wrappers";

const inputs = [
  {
    assetId: ethers.utils.formatBytes32String("ETH"),
    status: 2, // 2 - active
  },
  {
    assetId: ethers.utils.formatBytes32String("BTC"),
    status: 2,  // 2 - active
  },
  {
    assetId: ethers.utils.formatBytes32String("SOL"),
    status: 2,  // 2 - active
  },
];

async function main(chainId: number) {
  const config = await loadConfig(chainId);
  const deployer = (await ethers.getSigners())[0];
  const oracle = OracleMiddleware__factory.connect(config.oracles.middleware, deployer);

  console.log("> OracleMiddleware setMultipleMarketStatus...");
  await (
    await oracle.setMultipleMarketStatus(
      inputs.map((each) => each.assetId),
      inputs.map((each) => each.status),
      {
        gasLimit: 10_000_000,
      }
    )
  ).wait();
  console.log("> OracleMiddleware setMultipleMarketStatus success!");
}

passChainArg(main);