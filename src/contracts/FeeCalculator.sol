// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import { AddressUtils } from "../libraries/AddressUtils.sol";

import { Owned } from "../base/Owned.sol";

import { IFeeCalculator } from "./interfaces/IFeeCalculator.sol";
import { IOracleMiddleware } from "../oracle/interfaces/IOracleMiddleware.sol";
import { IVaultStorage } from "../storages/interfaces/IVaultStorage.sol";
import { IConfigStorage } from "../storages/interfaces/IConfigStorage.sol";

contract FeeCalculator is Owned, IFeeCalculator {
  // using libs for type
  using AddressUtils for address;

  /**
   * States
   */
  address public vaultStorage;
  address public configStorage;

  constructor(address _vaultStorage, address _configStorage) {
    // @todo - Sanity check
    vaultStorage = _vaultStorage;
    configStorage = _configStorage;
  }

  function payFundingFee(
    address subAccount,
    uint256 absFeeUsd,
    SettleFundingFeeLoopVar memory tmpVars
  ) external returns (uint256 newAbsFeeUsd) {
    address _vaultStorage = vaultStorage;

    // Calculate the fee amount in the plp underlying token
    tmpVars.feeTokenAmount = (absFeeUsd * (10 ** tmpVars.underlyingTokenDecimal)) / tmpVars.price;

    // Repay the fee amount and subtract it from the balance
    tmpVars.repayFeeTokenAmount = 0;

    if (tmpVars.traderBalance > tmpVars.feeTokenAmount) {
      tmpVars.repayFeeTokenAmount = tmpVars.feeTokenAmount;
      tmpVars.traderBalance -= tmpVars.feeTokenAmount;
      absFeeUsd = 0;
    } else {
      // Calculate the balance value of the plp underlying token in USD
      tmpVars.traderBalanceValue = (tmpVars.traderBalance * tmpVars.price) / (10 ** tmpVars.underlyingTokenDecimal);

      tmpVars.repayFeeTokenAmount = tmpVars.traderBalance;
      tmpVars.traderBalance = 0;
      absFeeUsd -= tmpVars.traderBalanceValue;
    }

    IVaultStorage(_vaultStorage).collectFundingFee(
      subAccount,
      tmpVars.underlyingToken,
      tmpVars.repayFeeTokenAmount,
      tmpVars.traderBalance
    );

    return absFeeUsd;
  }

  function receiveFundingFee(
    address subAccount,
    uint256 absFeeUsd,
    SettleFundingFeeLoopVar memory tmpVars
  ) external returns (uint256 newAbsFeeUsd) {
    address _vaultStorage = vaultStorage;

    // Calculate the fee amount in the plp underlying token
    tmpVars.feeTokenAmount = (absFeeUsd * (10 ** tmpVars.underlyingTokenDecimal)) / tmpVars.price;

    if (tmpVars.fundingFee > tmpVars.feeTokenAmount) {
      // funding fee token has enough amount to repay fee to trader
      tmpVars.repayFeeTokenAmount = tmpVars.feeTokenAmount;
      tmpVars.traderBalance += tmpVars.feeTokenAmount;
      absFeeUsd = 0;
    } else {
      // funding fee token has not enough amount to repay fee to trader
      // Calculate the funding Fee value of the plp underlying token in USD
      tmpVars.fundingFeeValue = (tmpVars.fundingFee * tmpVars.price) / (10 ** tmpVars.underlyingTokenDecimal);

      tmpVars.repayFeeTokenAmount = tmpVars.feeTokenAmount;
      tmpVars.traderBalance += tmpVars.feeTokenAmount;
      absFeeUsd -= tmpVars.fundingFeeValue;
    }

    IVaultStorage(_vaultStorage).repayFundingFee(
      subAccount,
      tmpVars.underlyingToken,
      tmpVars.repayFeeTokenAmount,
      tmpVars.traderBalance
    );

    return absFeeUsd;
  }

  function borrowFundingFeeFromPLP(
    address subAccount,
    address _oracle,
    address[] memory plpUnderlyingTokens,
    uint256 absFeeUsd
  ) external returns (uint256 newAbsFeeUsd) {
    address _vaultStorage = vaultStorage;
    address _configStorage = configStorage;

    // Loop through all the plp underlying tokens for the sub-account
    for (uint256 i = 0; i < plpUnderlyingTokens.length; ) {
      SettleFundingFeeLoopVar memory tmpVars;
      tmpVars.underlyingToken = plpUnderlyingTokens[i];
      tmpVars.underlyingTokenDecimal = IConfigStorage(_configStorage)
        .getPlpTokenConfigs(tmpVars.underlyingToken)
        .decimals;
      uint256 plpLiquidityAmount = IVaultStorage(_vaultStorage).plpLiquidity(tmpVars.underlyingToken);

      // Retrieve the latest price and confident threshold of the plp underlying token
      (tmpVars.price, ) = IOracleMiddleware(_oracle).getLatestPrice(
        tmpVars.underlyingToken.toBytes32(),
        false,
        IConfigStorage(_configStorage).getMarketConfigByToken(tmpVars.underlyingToken).priceConfidentThreshold,
        30
      );

      // Calculate the fee amount in the plp underlying token
      tmpVars.feeTokenAmount = (absFeeUsd * (10 ** tmpVars.underlyingTokenDecimal)) / tmpVars.price;

      uint256 borrowPlpLiquidityValue;
      if (plpLiquidityAmount > tmpVars.feeTokenAmount) {
        // plp underlying token has enough amount to repay fee to trader
        borrowPlpLiquidityValue = absFeeUsd;
        tmpVars.repayFeeTokenAmount = tmpVars.feeTokenAmount;
        tmpVars.traderBalance += tmpVars.feeTokenAmount;

        absFeeUsd = 0;
      } else {
        // plp underlying token has not enough amount to repay fee to trader
        // Calculate the plpLiquidityAmount value of the plp underlying token in USD
        borrowPlpLiquidityValue = (plpLiquidityAmount * tmpVars.price) / (10 ** tmpVars.underlyingTokenDecimal);
        tmpVars.repayFeeTokenAmount = plpLiquidityAmount;
        tmpVars.traderBalance += plpLiquidityAmount;
        absFeeUsd -= borrowPlpLiquidityValue;
      }

      IVaultStorage(_vaultStorage).borrowFundingFeeFromPLP(
        subAccount,
        tmpVars.underlyingToken,
        tmpVars.repayFeeTokenAmount,
        borrowPlpLiquidityValue,
        tmpVars.traderBalance
      );

      if (absFeeUsd == 0) {
        break;
      }

      {
        unchecked {
          ++i;
        }
      }
    }

    return absFeeUsd;
  }

  /// @notice Repay funding fee to PLP
  /// @param subAccount - Trader's sub-account to repay fee
  /// @param absFeeUsd - Fee value of trader's sub-account
  /// @param plpLiquidityDebtUSDE30 - Debt value from PLP
  /// @param tmpVars - Temporary struct variable
  function repayFundingFeeDebtToPLP(
    address subAccount,
    uint256 absFeeUsd,
    uint256 plpLiquidityDebtUSDE30,
    SettleFundingFeeLoopVar memory tmpVars
  ) external returns (uint256 newAbsFeeUsd) {
    address _vaultStorage = vaultStorage;

    // Calculate the sub-account's fee debt to token amounts
    tmpVars.feeTokenAmount = (absFeeUsd * (10 ** tmpVars.underlyingTokenDecimal)) / tmpVars.price;

    // Calculate the debt in USD to plp underlying token amounts
    uint256 plpLiquidityDebtAmount = (plpLiquidityDebtUSDE30 * (10 ** tmpVars.underlyingTokenDecimal)) / tmpVars.price;
    uint256 traderBalanceValueE30 = (tmpVars.traderBalance * tmpVars.price) / (10 ** tmpVars.underlyingTokenDecimal);

    if (tmpVars.feeTokenAmount >= plpLiquidityDebtAmount) {
      // If margin fee to repay is grater than debt on PLP (Rare case)
      if (tmpVars.traderBalance > tmpVars.feeTokenAmount) {
        // If trader has enough token amounts to repay fee to PLP
        tmpVars.repayFeeTokenAmount = tmpVars.feeTokenAmount; // Amount of feeTokenAmount that PLP will receive
        tmpVars.traderBalance -= tmpVars.feeTokenAmount; // Deducts all feeTokenAmount to repay to PLP
        tmpVars.feeTokenValue = plpLiquidityDebtUSDE30; // USD value of feeTokenAmount that PLP will receive
        absFeeUsd -= plpLiquidityDebtUSDE30; // Deducts margin fee on trader's sub-account
      } else {
        tmpVars.repayFeeTokenAmount = tmpVars.traderBalance; // Amount of feeTokenAmount that PLP will receive
        tmpVars.traderBalance = 0; // Deducts all feeTokenAmount to repay to PLP
        tmpVars.feeTokenValue = plpLiquidityDebtUSDE30; // USD value of feeTokenAmount that PLP will receive
        absFeeUsd -= traderBalanceValueE30; // Deducts margin fee on trader's sub-account
      }
    } else if (tmpVars.feeTokenAmount < plpLiquidityDebtAmount) {
      if (tmpVars.traderBalance >= tmpVars.feeTokenAmount) {
        traderBalanceValueE30 =
          ((tmpVars.traderBalance - tmpVars.feeTokenAmount) * tmpVars.price) /
          (10 ** tmpVars.underlyingTokenDecimal);

        tmpVars.repayFeeTokenAmount = tmpVars.feeTokenAmount; // Trader will repay fee with this token amounts they have
        tmpVars.traderBalance -= tmpVars.feeTokenAmount; // Deducts repay token amounts from trader account
        tmpVars.feeTokenValue = traderBalanceValueE30; // USD value of token amounts that PLP will receive
        absFeeUsd -= traderBalanceValueE30; // Deducts margin fee on trader's sub-account
      } else {
        tmpVars.repayFeeTokenAmount = tmpVars.traderBalance; // Trader will repay fee with this token amounts they have
        tmpVars.traderBalance = 0; // Deducts repay token amounts from trader account
        tmpVars.feeTokenValue = traderBalanceValueE30; // USD value of token amounts that PLP will receive
        absFeeUsd -= traderBalanceValueE30; // Deducts margin fee on trader's sub-account
      }

      return absFeeUsd;
    }

    IVaultStorage(_vaultStorage).repayFundingFeeToPLP(
      subAccount,
      tmpVars.underlyingToken,
      tmpVars.repayFeeTokenAmount,
      tmpVars.feeTokenValue,
      tmpVars.traderBalance
    );
  }
}
