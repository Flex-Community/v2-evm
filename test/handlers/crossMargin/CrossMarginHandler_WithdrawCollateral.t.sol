// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.18;

import { CrossMarginHandler_Base, IPerpStorage } from "./CrossMarginHandler_Base.t.sol";

// What is this test DONE
// - revert
//   - Try withdraw token collaeral with not accepted token (Ex. Fx, Equity)
//   - Try withdraw token collateral with incufficent allowance
// - success
//   - Try deposit and withdraw collateral with happy case
//   - Try deposit and withdraw collateral with happy case and check on token list of sub account
//   - Try deposit and withdraw multi tokens and checks on  token list of sub account

contract CrossMarginService_WithdrawCollateral is CrossMarginHandler_Base {
  function setUp() public virtual override {
    super.setUp();
  }

  /**
   * TEST REVERT
   */

  // Try withdraw token collaeral with not accepted token (Ex. Fx, Equity)
  function testRevert_handler_withdrawCollateral_onlyAcceptedToken() external {
    vm.prank(ALICE);
    vm.expectRevert(abi.encodeWithSignature("IConfigStorage_NotAcceptedCollateral()"));
    crossMarginHandler.withdrawCollateral(ALICE, SUB_ACCOUNT_NO, address(dai), 10 ether, priceDataBytes);
  }

  //  Try withdraw token collateral with incufficent allowance
  function testRevert_handler_withdrawCollateral_InsufficientBalance() external {
    vm.prank(ALICE);
    vm.expectRevert(abi.encodeWithSignature("ICrossMarginService_InsufficientBalance()"));
    crossMarginHandler.withdrawCollateral(ALICE, SUB_ACCOUNT_NO, address(weth), 10 ether, priceDataBytes);
  }

  function testRevert_handler_withdrawCollateral_setOraclePrice_withdrawBalanceBelowIMR() external {
    address subAccount = getSubAccount(ALICE, SUB_ACCOUNT_NO);

    // ALICE deposits WETH
    weth.mint(ALICE, 100 ether);
    simulateAliceDepositToken(address(weth), 100 ether);

    // ALICE opens LONG position on ETH market
    // Simulate ALICE contains 1 opening LONG position
    mockPerpStorage.setPositionBySubAccount(
      subAccount,
      IPerpStorage.Position({
        primaryAccount: address(1),
        subAccountId: SUB_ACCOUNT_NO,
        marketIndex: 0,
        positionSizeE30: 100_000 * 1e30,
        avgEntryPriceE30: 1_400 * 1e30,
        entryBorrowingRate: 0,
        entryFundingRate: 0,
        reserveValueE30: 9_000 * 1e30,
        lastIncreaseTimestamp: block.timestamp,
        realizedPnl: 0,
        openInterest: 0
      })
    );

    vm.expectRevert(abi.encodeWithSignature("ICrossMarginService_WithdrawBalanceBelowIMR()"));
    simulateAliceWithdrawToken(address(weth), 92 ether);
  }

  /**
   * TEST CORRECTNESS
   */

  // Try deposit and withdraw collateral with happy case
  function testCorrectness_handler_withdrawCollateral() external {
    address subAccount = getSubAccount(ALICE, SUB_ACCOUNT_NO);

    // Before start depositing, ALICE must has 0 amount of WETH token
    assertEq(vaultStorage.traderBalances(subAccount, address(weth)), 0);
    assertEq(weth.balanceOf(address(vaultStorage)), 0);
    assertEq(weth.balanceOf(ALICE), 0 ether);

    weth.mint(ALICE, 10 ether);
    simulateAliceDepositToken(address(weth), (10 ether));

    // After deposited, ALICE's sub account must has 10 WETH as collateral token
    assertEq(vaultStorage.traderBalances(subAccount, address(weth)), 10 ether);
    assertEq(weth.balanceOf(address(vaultStorage)), 10 ether);
    assertEq(weth.balanceOf(ALICE), 0 ether);

    simulateAliceWithdrawToken(address(weth), 3 ether);

    // After withdrawn, ALICE must has 7 WETH as collateral token
    assertEq(vaultStorage.traderBalances(subAccount, address(weth)), 7 ether);
    assertEq(weth.balanceOf(address(vaultStorage)), 7 ether);
    assertEq(weth.balanceOf(ALICE), 3 ether);
  }

  // Try deposit and withdraw collateral with happy case and check on token list of sub account
  function testCorrectness_handler_withdrawCollateral_traderTokenList_singleToken() external {
    address subAccount = getSubAccount(ALICE, SUB_ACCOUNT_NO);

    // Before ALICE start depositing, token lists must contains no token
    assertEq(vaultStorage.getTraderTokens(subAccount).length, 0);

    // ALICE deposits first time
    weth.mint(ALICE, 10 ether);
    simulateAliceDepositToken(address(weth), (10 ether));

    // After ALICE start depositing, token lists must contains 1 token
    assertEq(vaultStorage.getTraderTokens(subAccount).length, 1);

    // ALICE try withdrawing some of WETH from Vault
    simulateAliceWithdrawToken(address(weth), 3 ether);

    // After ALICE withdrawn some of WETH, list of token must still contain WETH
    assertEq(vaultStorage.getTraderTokens(subAccount).length, 1);

    // ALICE try withdrawing all of WETH from Vault
    simulateAliceWithdrawToken(address(weth), 7 ether);
    assertEq(vaultStorage.traderBalances(subAccount, address(weth)), 0 ether);
    assertEq(weth.balanceOf(ALICE), 10 ether);

    // After ALICE withdrawn all of WETH, list of token must be 0
    assertEq(vaultStorage.getTraderTokens(subAccount).length, 0);
  }
}