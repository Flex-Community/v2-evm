import { BotHandler__factory } from "../../../../typechain";
import { loadConfig } from "../../utils/config";
import { Command } from "commander";
import signers from "../../entities/signers";
import { OwnerWrapper } from "../../wrappers/OwnerWrapper";

const positionManagers = ["0x6629eC35c8Aa279BA45Dbfb575c728d3812aE31a", "0x0578C797798Ae89b688Cd5676348344d7d0EC35E"];

async function main(chainId: number) {
  const config = loadConfig(chainId);
  const deployer = signers.deployer(chainId);
  const ownerWrapper = new OwnerWrapper(chainId, deployer);
  const botHandler = BotHandler__factory.connect(config.handlers.bot, deployer);

  console.log("[configs/BotHandler] Proposing tx to set position managers");
  await ownerWrapper.authExec(
    botHandler.address,
    botHandler.interface.encodeFunctionData("setPositionManagers", [positionManagers, true])
  );
}

const prog = new Command();

prog.requiredOption("--chain-id <number>", "chain id", parseInt);

prog.parse(process.argv);

const opts = prog.opts();

main(opts.chainId).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
