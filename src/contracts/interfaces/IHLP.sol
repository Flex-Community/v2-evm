// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

interface IHLP {
  /**
   * ERRORS
   */
  error IHLP_onlyMinter();
  error IHLP_notTrustedTransferrer();

  /**
   * States
   */
  function totalSupply() external returns (uint256 _total);

  /**
   * Functions
   */
  function setMinter(address minter, bool isMinter) external;

  function mint(address to, uint256 amount) external;

  function burn(address from, uint256 amount) external;

  function setIsTrustedTransferrer(address _transferrer, bool _isTrusted) external;

  function trustedTransferFrom(address _from, address _to, uint256 _amount) external;

  function approve(address _to, uint256 _amount) external;

  function balanceOf(address _account) external returns (uint256 _amount);
}
