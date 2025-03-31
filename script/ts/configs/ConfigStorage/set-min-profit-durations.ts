import { ConfigStorage__factory } from "../../../../typechain";
import { loadConfig } from "../../utils/config";
import { Command } from "commander";
import signers from "../../entities/signers";
import { OwnerWrapper } from "../../wrappers/OwnerWrapper";
import { compareAddress } from "../../utils/address";
import { passChainArg, runMainAsAsync } from "../../utils/main-fn-wrappers";

async function main(chainId: number) {
  const config = loadConfig(chainId);
  const deployer = await signers.deployer(chainId);

  const inputs = [
    { marketIndex: 0, minProfitDuration: 180 },
    { marketIndex: 1, minProfitDuration: 180 },
    { marketIndex: 2, minProfitDuration: 180 },
  ];

  const ownerWrapper = new OwnerWrapper(chainId, deployer);
  const configStorage = ConfigStorage__factory.connect(config.storages.config, deployer);
  const owner = await configStorage.owner();

  console.log("[configs/ConfigStorage] Set Min Profit Duration by Market Index...");
  await ownerWrapper.authExec(
    configStorage.address,
    configStorage.interface.encodeFunctionData("setMinProfitDurations", [
      inputs.map((each) => each.marketIndex),
      inputs.map((each) => each.minProfitDuration),
    ])
  );

}

passChainArg(main)