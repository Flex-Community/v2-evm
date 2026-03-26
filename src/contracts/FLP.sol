// SPDX-License-Identifier: BUSL-1.1
// This code is made available under the terms and conditions of the Business Source License 1.1 (BUSL-1.1).
// The act of publishing this code is driven by the aim to promote transparency and facilitate its utilization for educational purposes.

pragma solidity 0.8.18;

import { ReentrancyGuardUpgradeable } from "@openzeppelin-upgradeable/contracts/security/ReentrancyGuardUpgradeable.sol";
import { OwnableUpgradeable } from "@openzeppelin-upgradeable/contracts/access/OwnableUpgradeable.sol";
import { ERC20Upgradeable } from "@openzeppelin-upgradeable/contracts/token/ERC20/ERC20Upgradeable.sol";

// Interfaces
import { IHLP } from "./interfaces/IHLP.sol";

contract FLP is ReentrancyGuardUpgradeable, OwnableUpgradeable, ERC20Upgradeable {
  mapping(address user => bool isMinter) public minters;
  mapping(address transferrer => bool isTrustedTransferrer) public isTrustedTransferrer;

  event SetMinter(address indexed minter, bool isMinter);
  event SetIsTrustedTransferrer(address indexed transferrer, bool isTrusted);

  /**
   * Modifiers
   */

  modifier onlyMinter() {
    if (!minters[msg.sender]) {
      revert IHLP.IHLP_onlyMinter();
    }
    _;
  }

  function initialize() external initializer {
    OwnableUpgradeable.__Ownable_init();
    ReentrancyGuardUpgradeable.__ReentrancyGuard_init();
    ERC20Upgradeable.__ERC20_init("FLP", "FLP");
  }

  function setMinter(address minter, bool isMinter) external onlyOwner {
    minters[minter] = isMinter;
    emit SetMinter(minter, isMinter);
  }

  function mint(address to, uint256 amount) external onlyMinter {
    _mint(to, amount);
  }

  function burn(address from, uint256 amount) external onlyMinter {
    _burn(from, amount);
  }

  function setIsTrustedTransferrer(address _transferrer, bool _isTrusted) external onlyOwner {
    isTrustedTransferrer[_transferrer] = _isTrusted;
    emit SetIsTrustedTransferrer(_transferrer, _isTrusted);
  }

  function trustedTransferFrom(address _from, address _to, uint256 _amount) external {
    if (!isTrustedTransferrer[msg.sender]) revert IHLP.IHLP_notTrustedTransferrer();
    _transfer(_from, _to, _amount);
  }

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }
}
