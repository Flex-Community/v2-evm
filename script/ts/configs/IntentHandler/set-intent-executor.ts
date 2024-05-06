import { IntentHandler__factory } from "../../../../typechain";
import { loadConfig } from "../../utils/config";
import { Command } from "commander";
import signers from "../../entities/signers";
import { OwnerWrapper } from "../../wrappers/OwnerWrapper";

async function main(chainId: number) {
  const config = loadConfig(chainId);
  const deployer = signers.deployer(chainId);
  const ownerWrapper = new OwnerWrapper(chainId, deployer);

  const intentExecutor = "0xf0d00E8435E71df33bdA19951B433B509A315aee";
  const isAllow = true;

  const intentHandler = IntentHandler__factory.connect(config.handlers.intent, deployer);
  console.log(`[configs/IntentHandler] Set Intent Executor`);
  await ownerWrapper.authExec(
    intentHandler.address,
    intentHandler.interface.encodeFunctionData("setIntentExecutor", [intentExecutor, isAllow])
  );
  console.log("[configs/IntentHandler] Finished");
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
