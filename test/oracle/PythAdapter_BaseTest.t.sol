// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import { BaseTest } from "../base/BaseTest.sol";
import { PythAdapter } from "@hmx/oracle/PythAdapter.sol";
import { AddressUtils } from "@hmx/libraries/AddressUtils.sol";

contract PythAdapter_BaseTest is BaseTest {
  using AddressUtils for address;

  PythAdapter pythAdapter;

  function setUp() public virtual {
    DeployReturnVars memory deployed = deployPerp88v2();
    pythAdapter = deployed.pythAdapter;
  }
}
