// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

contract MockNonEOA {
  function someFunction() external view returns (uint256) {
    return 1;
  }
}
