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
    { marketIndex: 0, isEnabled: false },
    { marketIndex: 1, isEnabled: false },
    { marketIndex: 2, isEnabled: false },

    { marketIndex: 3, isEnabled: false },
    { marketIndex: 4, isEnabled: false },
    { marketIndex: 5, isEnabled: false },
    { marketIndex: 6, isEnabled: false },
    { marketIndex: 7, isEnabled: false },
    { marketIndex: 8, isEnabled: false },
    { marketIndex: 9, isEnabled: false },
    { marketIndex: 10, isEnabled: false },
    { marketIndex: 11, isEnabled: false },
    { marketIndex: 12, isEnabled: false },
    { marketIndex: 13, isEnabled: false },
    { marketIndex: 14, isEnabled: false },
    { marketIndex: 15, isEnabled: false },
    { marketIndex: 16, isEnabled: false },
    { marketIndex: 17, isEnabled: false },
    { marketIndex: 18, isEnabled: false },
    { marketIndex: 19, isEnabled: false },
    { marketIndex: 20, isEnabled: false },
    { marketIndex: 21, isEnabled: false },
    
    { marketIndex: 22, isEnabled: false }, // XAU
    { marketIndex: 23, isEnabled: false }, // USOIL
    { marketIndex: 24, isEnabled: false }, // AAPL
    { marketIndex: 25, isEnabled: false }, // MSTR 
    { marketIndex: 26, isEnabled: false }, // TSLA
    { marketIndex: 27, isEnabled: false }, // NVDA

    { marketIndex: 28, isEnabled: false }, // FARTCOIN
    { marketIndex: 29, isEnabled: false }, // WIF
    { marketIndex: 30, isEnabled: false }, // BONK
    { marketIndex: 31, isEnabled: false }, // TAO
    { marketIndex: 32, isEnabled: false }, // JUP

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