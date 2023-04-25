import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers, tenderly } from "hardhat";
import { getConfig, writeConfigFile } from "./utils/config";

const BigNumber = ethers.BigNumber;
const config = getConfig();

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const deployer = (await ethers.getSigners())[0];

  const Contract = await ethers.getContractFactory("TradeService", deployer);
  const contract = await Contract.deploy(
    config.storages.perp,
    config.storages.vault,
    config.storages.config,
    config.helpers.trade
  );
  await contract.deployed();
  console.log(`Deploying TradeService Contract`);
  console.log(`Deployed at: ${contract.address}`);

  config.services.trade = contract.address;
  writeConfigFile(config);

  await tenderly.verify({
    address: contract.address,
    name: "TradeService",
  });
};

export default func;
func.tags = ["DeployTradeService"];