// SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.8.18;

interface IBoostLockerRegistry {

  function getLockUpValue3Months(address user) external view returns (uint256 lockUpValue);

  function getLockUpValue6Months(address user) external view returns (uint256 lockUpValue);

  function getLockUpValueAndMultiplier(
    address user
  )
    external
    view
    returns (
      uint256 lockUpValue3Months,
      uint256 lockUpValue6Months,
      uint256 multiplier
    );
}
