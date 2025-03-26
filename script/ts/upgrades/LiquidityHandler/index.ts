import { ethers, tenderly, upgrades, getChainId, run, network } from "hardhat";
import { loadConfig } from "../../utils/config";
import signers from "../../entities/signers";
import ProxyAdminWrapper from "../../wrappers/ProxyAdminWrapper";
import { getImplementationAddress } from "@openzeppelin/upgrades-core";

async function main() {
  const chainId = Number(await getChainId());
  const config = loadConfig(chainId);
  const deployer = await signers.deployer(chainId);
  const proxyAdminWrapper = new ProxyAdminWrapper(chainId, deployer);

  const LiquidityHandler = await ethers.getContractFactory("LiquidityHandler", deployer);
  const liquidityHandler = config.handlers.liquidity!;
  console.log("liquidityHandler", liquidityHandler);

  console.log(`[upgrade/LiquidityHandler] Preparing to upgrade LiquidityHandler`);
  const newImplementation = await upgrades.prepareUpgrade(liquidityHandler, LiquidityHandler);
  console.log(`[upgrade/LiquidityHandler] Done`);

  console.log(`[upgrade/LiquidityHandler] Verify contract on Tenderly at`, newImplementation);
  if (network.name != "tenderly") {
    console.log(`Verifying on-chain...`);
    await run("verify:verify", {
      address: newImplementation,
      constructorArguments: [],
    });
  }

  console.log(`Verifying Tenderly...`);
  await tenderly.verify({
    address: newImplementation,
    name: "LiquidityHandler",
  });

  console.log(`[upgrade/LiquidityHandler] New LiquidityHandler Implementation address: ${newImplementation}`);
  await proxyAdminWrapper.upgrade(liquidityHandler, newImplementation.toString());
  console.log(`[upgrade/LiquidityHandler] Upgraded!`);

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
