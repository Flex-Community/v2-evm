import { OracleMiddleware__factory } from "../../../../typechain";
import { loadConfig } from "../../utils/config";
import signers from "../../entities/signers";
import { OwnerWrapper } from "../../wrappers/OwnerWrapper";
import { passChainArg } from "../../utils/main-fn-wrappers";
import { getConfig_SetAssetPriceConfigs } from "./set-asset-price-configs.cfg";

async function main(chainId: number) {
  const config = loadConfig(chainId);
  const assetConfigs = getConfig_SetAssetPriceConfigs(chainId);

  const deployer = await signers.deployer(chainId);
  const ownerWrapper = new OwnerWrapper(chainId, deployer);
  const oracle = OracleMiddleware__factory.connect(config.oracles.middleware, deployer);

  console.log("[configs/OracleMiddleware] Setting asset price configs...");
  await ownerWrapper.authExec(
    oracle.address,
    oracle.interface.encodeFunctionData("setAssetPriceConfigs", [
      assetConfigs.map((each) => each.assetId),
      assetConfigs.map((each) => each.confidenceThreshold),
      assetConfigs.map((each) => each.trustPriceAge),
      assetConfigs.map((each) => each.adapter),
    ])
  );
}

passChainArg(main);