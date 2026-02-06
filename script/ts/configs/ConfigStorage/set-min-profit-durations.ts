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
    { marketIndex: 0, minProfitDuration: 60 },
    { marketIndex: 1, minProfitDuration: 60 },
    { marketIndex: 2, minProfitDuration: 60 },

    { marketIndex: 3, minProfitDuration: 60 },
    { marketIndex: 4, minProfitDuration: 60 },
    { marketIndex: 5, minProfitDuration: 60 },
    { marketIndex: 6, minProfitDuration: 60 },
    { marketIndex: 7, minProfitDuration: 60 },
    { marketIndex: 8, minProfitDuration: 60 },
    { marketIndex: 9, minProfitDuration: 60 },
    { marketIndex: 10, minProfitDuration: 60 },
    { marketIndex: 11, minProfitDuration: 60 },
    { marketIndex: 12, minProfitDuration: 60 },
    { marketIndex: 13, minProfitDuration: 60 },
    { marketIndex: 14, minProfitDuration: 60 },
    { marketIndex: 15, minProfitDuration: 60 },
    { marketIndex: 16, minProfitDuration: 60 },
    { marketIndex: 17, minProfitDuration: 60 },
    { marketIndex: 18, minProfitDuration: 60 },
    { marketIndex: 19, minProfitDuration: 60 },
    { marketIndex: 20, minProfitDuration: 60 },
    { marketIndex: 21, minProfitDuration: 60 },
    { marketIndex: 22, minProfitDuration: 60 }, // XAU
    { marketIndex: 23, minProfitDuration: 60 }, // USOIL
    { marketIndex: 24, minProfitDuration: 60 }, // AAPL
    { marketIndex: 25, minProfitDuration: 60 }, // MSTR
    { marketIndex: 26, minProfitDuration: 60 }, // TSLA
    { marketIndex: 27, minProfitDuration: 60 }, // NVDA

    { marketIndex: 28, minProfitDuration: 60 }, // FARTCOIN
    { marketIndex: 29, minProfitDuration: 60 }, // WIF
    { marketIndex: 30, minProfitDuration: 60 }, // BONK
    { marketIndex: 31, minProfitDuration: 60 }, // TAO
    { marketIndex: 32, minProfitDuration: 60 }, // JUP
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