// SPDX-License-Identifier: BUSL-1.1
// This code is made available under the terms and conditions of the Business Source License 1.1 (BUSL-1.1).
// The act of publishing this code is driven by the aim to promote transparency and facilitate its utilization for educational purposes.

pragma solidity 0.8.18;

import "forge-std/console.sol";
import { GlpStrategy_Base } from "./GlpStrategy_Base.t.fork.sol";
import { IRebalanceHLPService } from "@hmx/services/interfaces/IRebalanceHLPService.sol";
import { IRebalanceHLPHandler } from "@hmx/handlers/interfaces/IRebalanceHLPHandler.sol";
import { IERC20Upgradeable } from "@openzeppelin-upgradeable/contracts/token/ERC20/IERC20Upgradeable.sol";

contract RebalanceHLPSerivce is GlpStrategy_Base {
  uint256 arbitrumForkId = vm.createSelectFork(vm.rpcUrl("arbitrum_fork"));

  function setUp() public override {
    super.setUp();

    deal(wethAddress, address(vaultStorage), 100 ether);
    vaultStorage.pullToken(wethAddress);
    vaultStorage.addHLPLiquidity(wethAddress, 100 ether);
    deal(usdcAddress, address(vaultStorage), 10000 * 1e6);
    vaultStorage.pullToken(usdcAddress);
    vaultStorage.addHLPLiquidity(usdcAddress, 10000 * 1e6);
  }

  function testCorrectness_Rebalance_ReinvestSuccess() external {
    IRebalanceHLPService.ExecuteReinvestParams[] memory params = new IRebalanceHLPService.ExecuteReinvestParams[](2);
    uint256 usdcAmount = 1000 * 1e6;
    uint256 wethAmount = 10 * 1e18;

    params[0] = IRebalanceHLPService.ExecuteReinvestParams(usdcAddress, usdcAmount, 990 * 1e6, 100);
    params[1] = IRebalanceHLPService.ExecuteReinvestParams(wethAddress, wethAmount, 95 * 1e16, 100);

    uint256 usdcBefore = vaultStorage.hlpLiquidity(usdcAddress);
    uint256 wethBefore = vaultStorage.hlpLiquidity(wethAddress);
    uint256 sGlpBefore = vaultStorage.hlpLiquidity(address(sglp));

    uint256 receivedGlp = rebalanceHLPHandler.executeLogicReinvestNonHLP(params);

    // USDC
    assertEq(vaultStorage.hlpLiquidity(usdcAddress), usdcBefore - usdcAmount);
    assertEq(vaultStorage.hlpLiquidity(usdcAddress), vaultStorage.totalAmount(usdcAddress));
    // WETH
    assertEq(vaultStorage.hlpLiquidity(wethAddress), wethBefore - wethAmount);
    assertEq(vaultStorage.hlpLiquidity(wethAddress), vaultStorage.totalAmount(wethAddress));
    // sGLP
    assertEq(receivedGlp, vaultStorage.hlpLiquidity(address(sglp)) - sGlpBefore);

    // make sure that the allowance is zero
    assertEq(IERC20Upgradeable(usdcAddress).allowance(address(rebalanceHLPService), address(glpManager)), 0);
    assertEq(IERC20Upgradeable(wethAddress).allowance(address(rebalanceHLPService), address(glpManager)), 0);
  }

  function testCorrectness_Rebalance_WithdrawSuccess() external {
    IRebalanceHLPService.ExecuteReinvestParams[] memory params = new IRebalanceHLPService.ExecuteReinvestParams[](2);
    uint256 usdcAmount = 1000 * 1e6;
    uint256 wethAmount = 1 * 1e18;
    params[0] = IRebalanceHLPService.ExecuteReinvestParams(usdcAddress, usdcAmount, 990 * 1e6, 100);
    params[1] = IRebalanceHLPService.ExecuteReinvestParams(wethAddress, wethAmount, 95 * 1e16, 100);

    uint256 sGlpBefore = vaultStorage.totalAmount(address(sglp));
    uint256 receivedGlp = rebalanceHLPHandler.executeLogicReinvestNonHLP(params);

    uint256 sglpAmount = 15 * 1e18;

    assertEq(receivedGlp, vaultStorage.totalAmount(address(sglp)) - sGlpBefore);

    IRebalanceHLPService.ExecuteWithdrawParams[] memory _params = new IRebalanceHLPService.ExecuteWithdrawParams[](2);
    _params[0] = IRebalanceHLPService.ExecuteWithdrawParams(usdcAddress, sglpAmount, 0);
    _params[1] = IRebalanceHLPService.ExecuteWithdrawParams(wethAddress, sglpAmount, 0);

    uint256 usdcBalanceBefore = vaultStorage.totalAmount(usdcAddress);
    uint256 wethBalanceBefore = vaultStorage.totalAmount(wethAddress);

    uint256 sglpBefore = vaultStorage.hlpLiquidity(address(sglp));
    uint256 usdcHlpBefore = vaultStorage.hlpLiquidity(usdcAddress);
    uint256 wethHlpBefore = vaultStorage.hlpLiquidity(wethAddress);

    IRebalanceHLPService.WithdrawGLPResult[] memory result = rebalanceHLPHandler.executeLogicWithdrawGLP(_params);

    uint256 usdcBalanceAfter = vaultStorage.totalAmount(usdcAddress);
    uint256 wethBalanceAfter = vaultStorage.totalAmount(wethAddress);

    uint256 sglpAfter = vaultStorage.hlpLiquidity(address(sglp));
    uint256 usdcHlpAfter = vaultStorage.hlpLiquidity(usdcAddress);
    uint256 wethHlpAfter = vaultStorage.hlpLiquidity(wethAddress);

    assertTrue(usdcBalanceAfter > usdcBalanceBefore);
    assertTrue(wethBalanceAfter > wethBalanceBefore);

    assertTrue(usdcHlpAfter > usdcHlpBefore);
    assertTrue(wethHlpAfter > wethHlpBefore);

    assertEq(usdcBalanceAfter - usdcBalanceBefore, result[0].amount);
    assertEq(wethBalanceAfter - wethBalanceBefore, result[1].amount);

    assertEq(sglpBefore - sglpAfter, sglpAmount * 2);

    // make sure that the allowance is zero
    assertEq(IERC20Upgradeable(usdcAddress).allowance(address(rebalanceHLPService), address(glpManager)), 0);
    assertEq(IERC20Upgradeable(wethAddress).allowance(address(rebalanceHLPService), address(glpManager)), 0);
  }

  function testRevert_Rebalance_EmptyParams() external {
    IRebalanceHLPService.ExecuteReinvestParams[] memory params;
    vm.expectRevert(IRebalanceHLPHandler.RebalanceHLPHandler_ParamsIsEmpty.selector);
    rebalanceHLPHandler.executeLogicReinvestNonHLP(params);
  }

  function testRevert_Rebalance_OverAmount() external {
    IRebalanceHLPService.ExecuteReinvestParams[] memory params = new IRebalanceHLPService.ExecuteReinvestParams[](1);
    uint256 usdcAmount = 100_000 * 1e6;
    vm.expectRevert(bytes("ERC20: transfer amount exceeds balance"));
    params[0] = IRebalanceHLPService.ExecuteReinvestParams(usdcAddress, usdcAmount, 99_000 * 1e6, 10_000);
    rebalanceHLPHandler.executeLogicReinvestNonHLP(params);
  }

  function testRevert_Rebalance_NotWhitelisted() external {
    IRebalanceHLPService.ExecuteReinvestParams[] memory params;
    vm.expectRevert(IRebalanceHLPHandler.RebalanceHLPHandler_OnlyWhitelisted.selector);
    vm.prank(ALICE);
    rebalanceHLPHandler.executeLogicReinvestNonHLP(params);
  }

  function testRevert_Rebalance_WithdrawExceedingAmount() external {
    IRebalanceHLPService.ExecuteWithdrawParams[] memory params = new IRebalanceHLPService.ExecuteWithdrawParams[](1);
    params[0] = IRebalanceHLPService.ExecuteWithdrawParams(usdcAddress, 1e30, 0);
    vm.expectRevert(IRebalanceHLPHandler.RebalanceHLPHandler_InvalidTokenAmount.selector);
    rebalanceHLPHandler.executeLogicWithdrawGLP(params);
  }
}
