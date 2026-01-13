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
    { marketIndex: 0, minProfitDuration: 2 },
    { marketIndex: 1, minProfitDuration: 2 },
    { marketIndex: 2, minProfitDuration: 2 },

    { marketIndex: 3, minProfitDuration: 2 },
    { marketIndex: 4, minProfitDuration: 2 },
    { marketIndex: 5, minProfitDuration: 2 },
    { marketIndex: 6, minProfitDuration: 2 },
    { marketIndex: 7, minProfitDuration: 2 },
    { marketIndex: 8, minProfitDuration: 2 },
    { marketIndex: 9, minProfitDuration: 2 },
    { marketIndex: 10, minProfitDuration: 2 },
    { marketIndex: 11, minProfitDuration: 2 },
    { marketIndex: 12, minProfitDuration: 2 },
    { marketIndex: 13, minProfitDuration: 2 },
    { marketIndex: 14, minProfitDuration: 2 },
    { marketIndex: 15, minProfitDuration: 2 },
    { marketIndex: 16, minProfitDuration: 2 },
    { marketIndex: 17, minProfitDuration: 2 },
    { marketIndex: 18, minProfitDuration: 2 },
    { marketIndex: 19, minProfitDuration: 2 },
    { marketIndex: 20, minProfitDuration: 2 },
    { marketIndex: 21, minProfitDuration: 2 },
    { marketIndex: 22, minProfitDuration: 2 }, // XAU
    { marketIndex: 23, minProfitDuration: 2 }, // USOIL
    { marketIndex: 24, minProfitDuration: 2 }, // AAPL
    { marketIndex: 25, minProfitDuration: 2 }, // MSTR
    { marketIndex: 26, minProfitDuration: 2 }, // TSLA
    { marketIndex: 27, minProfitDuration: 2 }, // NVDA

    { marketIndex: 28, minProfitDuration: 2 }, // FARTCOIN
    { marketIndex: 29, minProfitDuration: 2 }, // WIF
    { marketIndex: 30, minProfitDuration: 2 }, // BONK
    { marketIndex: 31, minProfitDuration: 2 }, // TAO
    { marketIndex: 32, minProfitDuration: 2 }, // JUP
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