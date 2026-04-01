import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { getChainId } from "hardhat";
import { FLP__factory, LiquidityHandler__factory } from "../../../../typechain";
import { getConfig, loadConfig } from "../../utils/config";
import signers from "../../entities/signers";


async function main() {
  const chainId = Number(await getChainId());
  const config = loadConfig(chainId);
  const deployer = await signers.deployer(chainId);
  
  const flp = FLP__factory.connect(config.tokens.hlp!, deployer as any);

  console.log(`> FLP Set Trusted Transferrer... ${config.handlers.liquidity}`);
  const tx = await flp.setIsTrustedTransferrer(config.handlers.liquidity as string, true);
  await tx.wait();
  console.log("> FLP Set Trusted Transferrer success!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
