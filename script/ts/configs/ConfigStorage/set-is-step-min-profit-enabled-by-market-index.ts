import { ConfigStorage__factory } from "../../../../typechain";
import { loadConfig } from "../../utils/config";
import { Command } from "commander";
import signers from "../../entities/signers";
import { OwnerWrapper } from "../../wrappers/OwnerWrapper";
import { ethers } from "ethers";
import { passChainArg } from "../../utils/main-fn-wrappers";

async function main(chainId: number) {
  const config = loadConfig(chainId);

  const inputs = [
    { marketIndex: 0, isEnabled: true },
    { marketIndex: 1, isEnabled: true },
    { marketIndex: 2, isEnabled: true },

    { marketIndex: 3, isEnabled: true },
    { marketIndex: 4, isEnabled: true },
    { marketIndex: 5, isEnabled: true },
    { marketIndex: 6, isEnabled: true },
    { marketIndex: 7, isEnabled: true },
    { marketIndex: 8, isEnabled: true },
    { marketIndex: 9, isEnabled: true },
    { marketIndex: 10, isEnabled: true },
    { marketIndex: 11, isEnabled: true },
    { marketIndex: 12, isEnabled: true },
    { marketIndex: 13, isEnabled: true },
    { marketIndex: 14, isEnabled: true },
    { marketIndex: 15, isEnabled: true },
    { marketIndex: 16, isEnabled: true },
    { marketIndex: 17, isEnabled: true },
    { marketIndex: 18, isEnabled: true },
    { marketIndex: 19, isEnabled: true },
    { marketIndex: 20, isEnabled: true },
    { marketIndex: 21, isEnabled: true },


  ];

  const deployer = await signers.deployer(chainId);
  const ownerWrapper = new OwnerWrapper(chainId, deployer);
  const configStorage = ConfigStorage__factory.connect(config.storages.config, deployer);

  console.log("[config/ConfigStorage] Enable Step Min Profit Duration for Markets...");
  console.table(inputs);
  await ownerWrapper.authExec(
    configStorage.address,
    configStorage.interface.encodeFunctionData("setIsStepMinProfitEnabledByMarketIndex", [
      inputs.map((e) => e.marketIndex),
      inputs.map((e) => e.isEnabled),
    ])
  );
  console.log("[config/ConfigStorage] Done");
}

passChainArg(main)