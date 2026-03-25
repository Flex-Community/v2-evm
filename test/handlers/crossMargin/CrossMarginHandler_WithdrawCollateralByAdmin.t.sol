// SPDX-License-Identifier: BUSL-1.1
// This code is made available under the terms and conditions of the Business Source License 1.1 (BUSL-1.1).
// The act of publishing this code is driven by the aim to promote transparency and facilitate its utilization for educational purposes.

pragma solidity 0.8.18;

import { CrossMarginHandler_Base } from "./CrossMarginHandler_Base.t.sol";
import { CrossMarginHandler } from "@hmx/handlers/CrossMarginHandler.sol";
import { ICrossMarginHandler } from "@hmx/handlers/interfaces/ICrossMarginHandler.sol";

contract CrossMarginHandler_WithdrawCollateralByAdmin is CrossMarginHandler_Base {
  uint256 internal constant CBBTC_DEPOSIT = 1e8; // 1 WBTC (8 decimals)
  uint256 internal constant USDC_DEPOSIT = 10e6; // 10 USDC (6 decimals)
  uint256 internal constant ETH_DEPOSIT = 1 ether;

  CrossMarginHandler internal crossMarginHandlerImpl;

  function setUp() public virtual override {
    super.setUp();
    ecoPyth.insertAssetId(usdcAssetId);
    oracleMiddleware.setAssetPriceConfig(usdcAssetId, 1e6, 60, address(pythAdapter));
    crossMarginHandlerImpl = CrossMarginHandler(payable(address(crossMarginHandler)));
  }

  function testCorrectness_handler_createWithdrawCollateralOrderByAdmin_batchWithdrawAll() external {
    _depositAllCollateralFor(ALICE);
    _depositAllCollateralFor(BOB);

    address aliceSubAccount = getSubAccount(ALICE, SUB_ACCOUNT_NO);
    address bobSubAccount = getSubAccount(BOB, SUB_ACCOUNT_NO);

    assertEq(vaultStorage.traderBalances(aliceSubAccount, address(wbtc)), CBBTC_DEPOSIT);
    assertEq(vaultStorage.traderBalances(aliceSubAccount, address(usdc)), USDC_DEPOSIT);
    assertEq(vaultStorage.traderBalances(aliceSubAccount, address(weth)), ETH_DEPOSIT);
    assertEq(vaultStorage.traderBalances(bobSubAccount, address(wbtc)), CBBTC_DEPOSIT);
    assertEq(vaultStorage.traderBalances(bobSubAccount, address(usdc)), USDC_DEPOSIT);
    assertEq(vaultStorage.traderBalances(bobSubAccount, address(weth)), ETH_DEPOSIT);

    (
      address payable[] memory accounts,
      uint8[] memory subAccountIds,
      address[] memory tokens,
      uint256[] memory amounts,
      bool[] memory shouldUnwraps
    ) = _buildBatchWithdrawInputs();

    uint256 executionFee = accounts.length; // 1 wei per order
    crossMarginHandlerImpl.createWithdrawCollateralOrderByAdmin{ value: executionFee }(
      accounts,
      subAccountIds,
      tokens,
      amounts,
      executionFee,
      shouldUnwraps
    );

    assertEq(crossMarginHandler.getWithdrawOrderLength(), 6);

    bytes32[] memory priceUpdateData = ecoPyth.buildPriceUpdateData(tickPrices);
    bytes32[] memory publishTimeUpdateData = ecoPyth.buildPublishTimeUpdateData(publishTimeDiffs);
    crossMarginHandler.executeOrder({
      _endIndex: 5,
      _feeReceiver: payable(FEEVER),
      _priceData: priceUpdateData,
      _publishTimeData: publishTimeUpdateData,
      _minPublishTime: block.timestamp,
      _encodedVaas: keccak256("someEncodedVaas")
    });

    assertEq(vaultStorage.traderBalances(aliceSubAccount, address(wbtc)), 0);
    assertEq(vaultStorage.traderBalances(aliceSubAccount, address(usdc)), 0);
    assertEq(vaultStorage.traderBalances(aliceSubAccount, address(weth)), 0);
    assertEq(vaultStorage.traderBalances(bobSubAccount, address(wbtc)), 0);
    assertEq(vaultStorage.traderBalances(bobSubAccount, address(usdc)), 0);
    assertEq(vaultStorage.traderBalances(bobSubAccount, address(weth)), 0);

    assertEq(wbtc.balanceOf(ALICE), CBBTC_DEPOSIT);
    assertEq(usdc.balanceOf(ALICE), USDC_DEPOSIT);
    assertEq(ALICE.balance, ETH_DEPOSIT);
    assertEq(wbtc.balanceOf(BOB), CBBTC_DEPOSIT);
    assertEq(usdc.balanceOf(BOB), USDC_DEPOSIT);
    assertEq(BOB.balance, ETH_DEPOSIT);

    ICrossMarginHandler.WithdrawOrder[] memory aliceExecutedOrders = crossMarginHandler.getExecutedWithdrawOrders(
      aliceSubAccount,
      10,
      0
    );
    ICrossMarginHandler.WithdrawOrder[] memory bobExecutedOrders = crossMarginHandler.getExecutedWithdrawOrders(
      bobSubAccount,
      10,
      0
    );
    assertEq(aliceExecutedOrders.length, 3);
    assertEq(bobExecutedOrders.length, 3);
    for (uint256 i = 0; i < aliceExecutedOrders.length; i++) {
      assertEq(uint256(aliceExecutedOrders[i].status), 1);
      assertEq(uint256(bobExecutedOrders[i].status), 1);
    }
  }

  function testRevert_handler_createWithdrawCollateralOrderByAdmin_onlyOwner() external {
    address payable[] memory accounts = new address payable[](1);
    uint8[] memory subAccountIds = new uint8[](1);
    address[] memory tokens = new address[](1);
    uint256[] memory amounts = new uint256[](1);
    bool[] memory shouldUnwraps = new bool[](1);

    accounts[0] = payable(ALICE);
    subAccountIds[0] = SUB_ACCOUNT_NO;
    tokens[0] = address(wbtc);
    amounts[0] = CBBTC_DEPOSIT;
    shouldUnwraps[0] = false;

    vm.deal(ALICE, 1);
    vm.prank(ALICE);
    vm.expectRevert("Ownable: caller is not the owner");
    crossMarginHandlerImpl.createWithdrawCollateralOrderByAdmin{ value: 1 }(
      accounts,
      subAccountIds,
      tokens,
      amounts,
      1,
      shouldUnwraps
    );
  }

  function testRevert_handler_createWithdrawCollateralOrderByAdmin_executionFeeMustEqualOrderCount() external {
    address payable[] memory accounts = new address payable[](2);
    uint8[] memory subAccountIds = new uint8[](2);
    address[] memory tokens = new address[](2);
    uint256[] memory amounts = new uint256[](2);
    bool[] memory shouldUnwraps = new bool[](2);

    accounts[0] = payable(ALICE);
    accounts[1] = payable(BOB);
    subAccountIds[0] = SUB_ACCOUNT_NO;
    subAccountIds[1] = SUB_ACCOUNT_NO;
    tokens[0] = address(wbtc);
    tokens[1] = address(usdc);
    amounts[0] = CBBTC_DEPOSIT;
    amounts[1] = USDC_DEPOSIT;
    shouldUnwraps[0] = false;
    shouldUnwraps[1] = false;

    vm.expectRevert(ICrossMarginHandler.ICrossMarginHandler_InsufficientExecutionFee.selector);
    crossMarginHandlerImpl.createWithdrawCollateralOrderByAdmin{ value: 1 }(
      accounts,
      subAccountIds,
      tokens,
      amounts,
      1,
      shouldUnwraps
    );
  }

  function _depositAllCollateralFor(address _user) internal {
    wbtc.mint(_user, CBBTC_DEPOSIT);
    usdc.mint(_user, USDC_DEPOSIT);
    vm.deal(_user, ETH_DEPOSIT);

    vm.startPrank(_user);
    wbtc.approve(address(crossMarginHandler), CBBTC_DEPOSIT);
    crossMarginHandler.depositCollateral(SUB_ACCOUNT_NO, address(wbtc), CBBTC_DEPOSIT, false);
    usdc.approve(address(crossMarginHandler), USDC_DEPOSIT);
    crossMarginHandler.depositCollateral(SUB_ACCOUNT_NO, address(usdc), USDC_DEPOSIT, false);
    crossMarginHandler.depositCollateral{ value: ETH_DEPOSIT }(SUB_ACCOUNT_NO, address(weth), ETH_DEPOSIT, true);
    vm.stopPrank();
  }

  function _buildBatchWithdrawInputs()
    internal
    view
    returns (
      address payable[] memory accounts,
      uint8[] memory subAccountIds,
      address[] memory tokens,
      uint256[] memory amounts,
      bool[] memory shouldUnwraps
    )
  {
    accounts = new address payable[](6);
    subAccountIds = new uint8[](6);
    tokens = new address[](6);
    amounts = new uint256[](6);
    shouldUnwraps = new bool[](6);

    // ALICE
    accounts[0] = payable(ALICE);
    accounts[1] = payable(ALICE);
    accounts[2] = payable(ALICE);
    subAccountIds[0] = SUB_ACCOUNT_NO;
    subAccountIds[1] = SUB_ACCOUNT_NO;
    subAccountIds[2] = SUB_ACCOUNT_NO;
    tokens[0] = address(wbtc);
    tokens[1] = address(usdc);
    tokens[2] = address(weth);
    amounts[0] = CBBTC_DEPOSIT;
    amounts[1] = USDC_DEPOSIT;
    amounts[2] = ETH_DEPOSIT;
    shouldUnwraps[0] = false;
    shouldUnwraps[1] = false;
    shouldUnwraps[2] = true;

    // BOB
    accounts[3] = payable(BOB);
    accounts[4] = payable(BOB);
    accounts[5] = payable(BOB);
    subAccountIds[3] = SUB_ACCOUNT_NO;
    subAccountIds[4] = SUB_ACCOUNT_NO;
    subAccountIds[5] = SUB_ACCOUNT_NO;
    tokens[3] = address(wbtc);
    tokens[4] = address(usdc);
    tokens[5] = address(weth);
    amounts[3] = CBBTC_DEPOSIT;
    amounts[4] = USDC_DEPOSIT;
    amounts[5] = ETH_DEPOSIT;
    shouldUnwraps[3] = false;
    shouldUnwraps[4] = false;
    shouldUnwraps[5] = true;
  }
}
