import { ethers } from "ethers";
import { ConfigStorage__factory } from "../../../../typechain";
import { loadConfig } from "../../utils/config";
import { Command } from "commander";
import signers from "../../entities/signers";
import { OwnerWrapper } from "../../wrappers/OwnerWrapper";

async function main(chainId: number) {
  const config = loadConfig(chainId);
  const deployer = signers.deployer(chainId);
  const ownerWrapper = new OwnerWrapper(chainId, deployer);
  const configStorage = ConfigStorage__factory.connect(config.storages.config, deployer);

  const inputs = [
    {
      tokenAddress: config.tokens.usdc,
      config: {
        targetWeight: ethers.utils.parseEther("0.25"), // 25%
        bufferLiquidity: 0,
        maxWeightDiff: ethers.utils.parseEther("1000"), // 100000 % (Don't check max weight diff at launch)
        accepted: true,
      },
    },
    {
      tokenAddress: config.tokens.weth,
      config: {
        targetWeight: ethers.utils.parseEther("0.50"), // 50%
        bufferLiquidity: 0,
        maxWeightDiff: ethers.utils.parseEther("1000"), // 100000 % (Don't check max weight diff at launch)
        accepted: true,
      },
    },
  ];

  console.log("[configs/ConfigStorage] AddOrUpdateAcceptedToken...");
  await ownerWrapper.authExec(
    configStorage.address,
    configStorage.interface.encodeFunctionData("addOrUpdateAcceptedToken", [
      inputs.map((each) => each.tokenAddress),
      inputs.map((each) => each.config),
    ])
  );
}

const prog = new Command();

prog.requiredOption("--chain-id <number>", "chain id", parseInt);

prog.parse(process.argv);

const opts = prog.opts();

main(opts.chainId)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
