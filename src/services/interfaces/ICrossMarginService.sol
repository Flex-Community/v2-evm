// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

interface ICrossMarginService {
  /**
   * Errors
   */
  error ICrossMarginService_InvalidDepositBalance();
  error ICrossMarginService_InvalidAddress();
  error ICrossMarginService_InsufficientBalance();
  error ICrossMarginService_WithdrawBalanceBelowIMR();

  function configStorage() external returns (address _configStorage);

  function vaultStorage() external returns (address _vaultStorage);

  function setConfigStorage(address _configStorage) external;

  function setVaultStorage(address _vaultStorage) external;

  function depositCollateral(address _primaryAccount, uint256 _subAccountId, address _token, uint256 _amount) external;

  function withdrawCollateral(address _primaryAccount, uint256 _subAccountId, address _token, uint256 _amount) external;
}