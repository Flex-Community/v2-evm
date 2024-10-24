import { IntentHandler__factory } from "../../../../typechain";
import { loadConfig } from "../../utils/config";
import signers from "../../entities/signers";
import { OwnerWrapper } from "../../wrappers/OwnerWrapper";
import { passChainArg } from "../../utils/main-fn-wrappers";

async function main(chainId: number) {
  const config = loadConfig(chainId);
  const deployer = signers.deployer(chainId);
  const ownerWrapper = new OwnerWrapper(chainId, deployer);

  const intentExecutors = [
    "0xf0d00E8435E71df33bdA19951B433B509A315aee",
    "0xddfb5a5D0eF7311E1D706912C38C809Ac1e469d0",
    "0xdb09967dCDC0086f7b5d798f71De664c068e92De",
    "0xdb1c35fD123e2CeDa64F19f419dC4481177d77c7",
    "0xdb2bD1c6498393B1072d1152a1FFF265D8D00665",
    "0xdb3ea875d628496B6EC97691455b53b221FCd963",
    "0xdb42bC3EFd76b82FC5023b11efc4b4eC60ed413c",
  ];

  console.group(`[configs/IntentHandler]`);
  for(const intentExecutor of intentExecutors) {
    const isAllow = true;

    const intentHandler = IntentHandler__factory.connect(config.handlers.intent, deployer);
    console.log(`Set Intent Executor`, intentExecutor, isAllow);
    await ownerWrapper.authExec(
      intentHandler.address,
      intentHandler.interface.encodeFunctionData("setIntentExecutor", [intentExecutor, isAllow])
    );
    console.log("Finished");
  }
  console.groupEnd();

}

passChainArg(main)