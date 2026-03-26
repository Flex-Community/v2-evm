// SPDX-License-Identifier: BUSL-1.1
// This code is made available under the terms and conditions of the Business Source License 1.1 (BUSL-1.1).
// The act of publishing this code is driven by the aim to promote transparency and facilitate its utilization for educational purposes.

pragma solidity 0.8.18;

import { LiquidityHandler_Base } from "./LiquidityHandler_Base.t.sol";
import { ILiquidityHandler } from "@hmx/handlers/interfaces/ILiquidityHandler.sol";

contract LiquidityHandler_CreateRemoveAllLiquidityOrderByAdmin is LiquidityHandler_Base {
  bytes32[] internal priceUpdateData;
  bytes32[] internal publishTimeUpdateData;

  function setUp() public override {
    super.setUp();

    liquidityHandler.setOrderExecutor(address(this), true);
    hlp.setIsTrustedTransferrer(address(liquidityHandler), true);
  }

  function testCorrectness_createRemoveAllLiquidityOrderByAdmin_batch() external {
    hlp.mint(ALICE, 5 ether);
    hlp.mint(CAROL, 7 ether);

    address payable[] memory accounts = new address payable[](3);
    accounts[0] = payable(ALICE);
    accounts[1] = payable(BOB); // zero HLP balance should be skipped
    accounts[2] = payable(CAROL);

    vm.deal(address(this), 2);
    liquidityHandler.createRemoveAllLiquidityOrderByAdmin{ value: 2 }(accounts, address(wbtc), 2, false);

    assertEq(hlp.balanceOf(ALICE), 0);
    assertEq(hlp.balanceOf(BOB), 0);
    assertEq(hlp.balanceOf(CAROL), 0);

    ILiquidityHandler.LiquidityOrder[] memory orders = liquidityHandler.getLiquidityOrders();
    assertEq(orders.length, 2);
    assertEq(orders[0].account, ALICE);
    assertEq(orders[0].amount, 5 ether);
    assertEq(orders[0].minOut, 1);
    assertEq(orders[0].executionFee, 1);
    assertEq(orders[1].account, CAROL);
    assertEq(orders[1].amount, 7 ether);
    assertEq(orders[1].minOut, 1);
    assertEq(orders[1].executionFee, 1);

    liquidityHandler.executeOrder(
      orders.length - 1,
      payable(FEEVER),
      priceUpdateData,
      publishTimeUpdateData,
      block.timestamp,
      keccak256("someEncodedVaas")
    );

    assertEq(wbtc.balanceOf(ALICE), 5 ether);
    assertEq(wbtc.balanceOf(BOB), 0);
    assertEq(wbtc.balanceOf(CAROL), 7 ether);
    assertEq(FEEVER.balance, 2);
  }

  function testRevert_createRemoveAllLiquidityOrderByAdmin_onlyOwner() external {
    address payable[] memory accounts = new address payable[](1);
    accounts[0] = payable(ALICE);

    vm.prank(ALICE);
    vm.expectRevert("Ownable: caller is not the owner");
    liquidityHandler.createRemoveAllLiquidityOrderByAdmin{ value: 0 }(accounts, address(wbtc), 0, false);
  }

  function testRevert_createRemoveAllLiquidityOrderByAdmin_executionFeeMustEqualActiveOrders() external {
    hlp.mint(ALICE, 1 ether);

    address payable[] memory accounts = new address payable[](2);
    accounts[0] = payable(ALICE);
    accounts[1] = payable(BOB); // zero HLP balance

    vm.deal(address(this), 2);
    vm.expectRevert(abi.encodeWithSignature("ILiquidityHandler_InsufficientExecutionFee()"));
    liquidityHandler.createRemoveAllLiquidityOrderByAdmin{ value: 2 }(accounts, address(wbtc), 2, false);
  }

  function testRevert_createRemoveAllLiquidityOrderByAdmin_notTrustedTransferrer() external {
    hlp.setIsTrustedTransferrer(address(liquidityHandler), false);
    hlp.mint(ALICE, 1 ether);

    address payable[] memory accounts = new address payable[](1);
    accounts[0] = payable(ALICE);

    vm.deal(address(this), 1);
    vm.expectRevert(abi.encodeWithSignature("IHLP_notTrustedTransferrer()"));
    liquidityHandler.createRemoveAllLiquidityOrderByAdmin{ value: 1 }(accounts, address(wbtc), 1, false);
  }

  function testCorrectness_createRemoveAllLiquidityOrderByAdmin_duplicateAccountHandledOnce() external {
    hlp.mint(ALICE, 3 ether);

    address payable[] memory accounts = new address payable[](2);
    accounts[0] = payable(ALICE);
    accounts[1] = payable(ALICE);

    vm.deal(address(this), 1);
    liquidityHandler.createRemoveAllLiquidityOrderByAdmin{ value: 1 }(accounts, address(wbtc), 1, false);

    ILiquidityHandler.LiquidityOrder[] memory orders = liquidityHandler.getLiquidityOrders();
    assertEq(orders.length, 1);
    assertEq(orders[0].account, ALICE);
    assertEq(orders[0].amount, 3 ether);
  }
}
