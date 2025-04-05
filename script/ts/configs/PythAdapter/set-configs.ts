import { ethers } from "ethers";
import { PythAdapter__factory } from "../../../../typechain";
import { loadConfig } from "../../utils/config";
import signers from "../../entities/signers";
import { Command } from "commander";
import { OwnerWrapper } from "../../wrappers/OwnerWrapper";
import { passChainArg } from "../../utils/main-fn-wrappers";
import { SET_CONFIGS } from "./set-configs.cfg";

const inputs = SET_CONFIGS

async function main(chainId: number) {
  const config = loadConfig(chainId);
  const deployer = await signers.deployer(chainId);
  const ownerWrapper = new OwnerWrapper(chainId, deployer);
  const pythAdapter = PythAdapter__factory.connect(config.oracles.pythAdapter, deployer);

  console.log("[configs/PythAdapter] Setting configs...");
  await ownerWrapper.authExec(
    pythAdapter.address,
    pythAdapter.interface.encodeFunctionData("setConfigs", [
      inputs.map((each) => each.assetId),
      inputs.map((each) => each.pythPriceId),
      inputs.map((each) => each.inverse),
    ])
  );
}

passChainArg(main);