// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import { ForkDevBaseTest } from "./base/ForkDevBaseTest.fork.t.sol";
import { console2 } from "forge-std/console2.sol";
import { Deployer } from "@hmx-test/libs/Deployer.sol";

contract ForkSyncProblemsForkTest is ForkDevBaseTest {
    
    function setUp() public override {
        super.setUp();
        
        // Deploy or get the contract instance
        
    }
    
    // Test cases will be added here
    // function test_getLiquidatableSubAccount() public onlyForkDev {
    //     // Test implementation will be added here
    //     console2.log("Liquidation Reader address:", address(liquidationReader));

    //     // console2.log("getLiquidatableSubAccount");
    // }

    function test_LiquidityHandler_getActiveLiquidityOrders() public onlyForkDev {
        // Test implementation will be added here
        console2.log("Liquidity Handler address:", address(liquidityHandler));

        // console2.log("getActiveLiquidityOrders");

        vm.startPrank(proxyAdmin.owner());
        Deployer.upgrade("LiquidityHandler", address(proxyAdmin), address(liquidityHandler));
        vm.stopPrank();

        liquidityHandler.getActiveLiquidityOrders(100, 0);
    }
} 