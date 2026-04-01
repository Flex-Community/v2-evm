import { ethers, tenderly, upgrades, network, run } from "hardhat";
import { loadConfig } from "../../utils/config";
import signers from "../../entities/signers";
import ProxyAdminWrapper from "../../wrappers/ProxyAdminWrapper";

async function main() {
  const chainId = (await ethers.provider.getNetwork()).chainId;
  const config = loadConfig(chainId);
  const deployer = await signers.deployer(chainId);
  const proxyAdminWrapper = new ProxyAdminWrapper(chainId, deployer as any);

  const Contract = await ethers.getContractFactory("FLP", deployer);
  const TARGET_ADDRESS = config.tokens.hlp!;

  console.log(`[upgrades/FLP] Preparing to upgrade FLP`);
  const newImplementation = await upgrades.prepareUpgrade(TARGET_ADDRESS, Contract);
  console.log(`[upgrades/FLP] Done`);

  try {
    if (network.name != "tenderly") {
      console.log(`Verifying on-chain...`);
      await run("verify:verify", {
        address: String(newImplementation),
        constructorArguments: [],
      });
    }
  } catch (error) {
    console.error('Error verifying contract on Etherscan', error);
  }
  
  try {
    console.log(`[upgrades/FLP] Verify contract on Tenderly`);
    await tenderly.verify({
      address: newImplementation.toString(),
      name: "FLP",
    });
  } catch (error) {
    console.error('Error verifying contract on Tenderly', error);
  }

  console.log(`[upgrades/FLP] New FLP Implementation address: ${newImplementation}`);
  await proxyAdminWrapper.upgrade(TARGET_ADDRESS, newImplementation.toString());

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
