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

    { marketIndex: 3, minProfitDuration: 180 },
    { marketIndex: 4, minProfitDuration: 180 },
    { marketIndex: 5, minProfitDuration: 180 },
    { marketIndex: 6, minProfitDuration: 180 },
    { marketIndex: 7, minProfitDuration: 180 },
    { marketIndex: 8, minProfitDuration: 180 },
    { marketIndex: 9, minProfitDuration: 180 },
    { marketIndex: 10, minProfitDuration: 180 },
    { marketIndex: 11, minProfitDuration: 180 },
    { marketIndex: 12, minProfitDuration: 180 },
    { marketIndex: 13, minProfitDuration: 180 },
    { marketIndex: 14, minProfitDuration: 180 },
    { marketIndex: 15, minProfitDuration: 180 },
    { marketIndex: 16, minProfitDuration: 180 },
    { marketIndex: 17, minProfitDuration: 180 },
    { marketIndex: 18, minProfitDuration: 180 },
    { marketIndex: 19, minProfitDuration: 180 },
    { marketIndex: 20, minProfitDuration: 180 },
    { marketIndex: 21, minProfitDuration: 180 },
    { marketIndex: 22, minProfitDuration: 180 }, // XAU
    { marketIndex: 23, minProfitDuration: 180 }, // USOIL
    { marketIndex: 24, minProfitDuration: 180 }, // AAPL
    { marketIndex: 25, minProfitDuration: 180 }, // MSTR
    { marketIndex: 26, minProfitDuration: 180 }, // TSLA
    { marketIndex: 27, minProfitDuration: 180 }, // NVDA

    { marketIndex: 28, minProfitDuration: 180 }, // FARTCOIN
    { marketIndex: 29, minProfitDuration: 180 }, // WIF
    { marketIndex: 30, minProfitDuration: 180 }, // BONK
    { marketIndex: 31, minProfitDuration: 180 }, // TAO
    { marketIndex: 32, minProfitDuration: 180 }, // JUP
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