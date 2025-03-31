import { ethers } from "ethers";
import { ConfigStorage__factory } from "../../../../typechain";
import { loadConfig } from "../../utils/config";
import signers from "../../entities/signers";
import { OwnerWrapper } from "../../wrappers/OwnerWrapper";
import { passChainArg } from "../../utils/main-fn-wrappers";
import {
  ConfigStorageNewMarketConfig,
  getMarketConfigForAdd
} from "./configs/market-config";

async function main(chainId: number) {
  const config = loadConfig(chainId);
  const deployer = await signers.deployer(chainId);
  const marketConfigs: Array<ConfigStorageNewMarketConfig> = await getMarketConfigForAdd(chainId);

  const ownerWrapper = new OwnerWrapper(chainId, deployer);
  const configStorage = ConfigStorage__factory.connect(config.storages.config, deployer);

  const configStorageMarketConfigsLength = await configStorage.getMarketConfigsLength();

  console.group('[configs/ConfigStorage]');
  console.log(`Adding ${marketConfigs.length} market configs...`);
  for (let i = 0; i < marketConfigs.length; i++) {
    if (configStorageMarketConfigsLength.toNumber() > i) {
      console.log(`🟢 Skipping ${ethers.utils.parseBytes32String(marketConfigs[i].assetId)} market config - already exists`);
      continue;
    }

    console.log(
      `🟠 Adding ${ethers.utils.parseBytes32String(marketConfigs[i].assetId)} market config[${i}]...`
    );
    await ownerWrapper.authExec(
      configStorage.address,
      configStorage.interface.encodeFunctionData("addMarketConfig", [
        marketConfigs[i],
        marketConfigs[i].isAdaptiveFeeEnabled,
      ])
    );
  }
  console.log('Finished');
  console.groupEnd();
  

}

passChainArg(main);