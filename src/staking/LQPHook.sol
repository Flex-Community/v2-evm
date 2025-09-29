// SPDX-License-Identifier: BUSL-1.1
// This code is made available under the terms and conditions of the Business Source License 1.1 (BUSL-1.1).
// The act of publishing this code is driven by the aim to promote transparency and facilitate its utilization for educational purposes.

pragma solidity 0.8.18;

import { OwnableUpgradeable } from "@openzeppelin-upgradeable/contracts/access/OwnableUpgradeable.sol";
import { ITradeServiceHook } from "../services/interfaces/ITradeServiceHook.sol";
import { IMintableToken } from "./interfaces/IMintableToken.sol";
import { IBoostLockerRegistry } from "./interfaces/IBoostLockerRegistry.sol";
import { FullMath } from "@hmx/libraries/FullMath.sol";

/// @title LQPHook
/// @notice Hook used by trading service to mint LQP rewards based on weekly trade volume and lock-up multiplier.
///         Designed to be invoked only by whitelisted callers (trading services).
contract LQPHook is ITradeServiceHook, OwnableUpgradeable {
  using FullMath for uint256;

  /// -----------------------------------------------------------------------
  /// Errors
  /// -----------------------------------------------------------------------
  error LQPHook_Forbidden();
  error LQPHook_BadArgs();

  /// -----------------------------------------------------------------------
  /// Types
  /// -----------------------------------------------------------------------

  /// @notice Tier configuration for trade-volume based boosts.
  /// @param minAmount Minimum trade volume (E30 decimals) inclusive.
  /// @param maxAmount Maximum trade volume (E30 decimals) exclusive. Use type(uint256).max for no limit.
  /// @param multiplier Boost multiplier (in basis points).
  struct Tier {
    uint256 minAmount;
    uint256 maxAmount;
    uint256 multiplier;
  }

  /// -----------------------------------------------------------------------
  /// Constants / State
  /// -----------------------------------------------------------------------

  uint32 internal constant BPS = 100_00;
  uint256 public constant epochLength = 1 weeks;

  /// @notice LQP token address (must implement IMintableToken).
  address public lqp;

  /// @notice Registry providing lock-up multiplier info.
  address public boostLockerRegistry;

  /// @notice Configured lock tiers (index ordered).
  Tier[] public tiers;

  /// @notice Allowed callers that can call hook functions.
  mapping(address => bool) public whitelistedCallers;

  /// @notice User trade volume within an epoch. epochTimestamp => user => amount (E30 decimals)
  mapping(uint256 => mapping(address => uint256)) public userTradeAmountE30;

  /// -----------------------------------------------------------------------
  /// Events
  /// -----------------------------------------------------------------------

  /// @notice Emitted when a tier is added (used during `setTiers` and initialization).
  event LogAddTier(Tier tier);

  /// @notice Emitted when a caller is added/removed from whitelist.
  event LogSetWhitelistedCaller(address indexed caller, bool isWhitelisted);

  /// @notice Emitted when LQP is minted as a result of a trade event.
  event LogMinted(
    address indexed to,
    uint256 mintAmount,
    uint256 multiplier,
    uint256 sizeDelta,
    uint256 epochTimestamp
  );

  /// @notice Emitted when a user's epoch trade volume is updated.
  event LogEpochVolumeUpdated(address indexed user, uint256 epochTimestamp, uint256 newAmount);

  /// -----------------------------------------------------------------------
  /// Modifiers
  /// -----------------------------------------------------------------------

  modifier onlyWhitelistedCaller() {
    if (!whitelistedCallers[msg.sender]) revert LQPHook_Forbidden();
    _;
  }

  /// -----------------------------------------------------------------------
  /// Initialization
  /// -----------------------------------------------------------------------

  /// @notice Initialize the hook with registry and LQP token address and default tiers.
  /// @param _boostLockerRegistry Address of the boost locker registry.
  /// @param _lqp Address of the LQP token (must implement IMintableToken).
  function initialize(address _boostLockerRegistry, address _lqp) external initializer {
    OwnableUpgradeable.__Ownable_init();

    boostLockerRegistry = _boostLockerRegistry;
    lqp = _lqp;

    // Sanity check: ensure LQP token implements expected interface (reverts if not).
    IMintableToken(lqp).totalSupply();

    // Default tiers (E30 decimals amounts and multipliers in bps)
    tiers.push(Tier(10_000e30, 20_000e30, 2_000));
    tiers.push(Tier(20_000e30, 50_000e30, 5_000));
    tiers.push(Tier(50_000e30, 100_000e30, 10_000));
    tiers.push(Tier(100_000e30, type(uint256).max, 20_000));
  }

  /// -----------------------------------------------------------------------
  /// Owner-only configuration
  /// -----------------------------------------------------------------------

  /// @notice Replace current tiers with `_tiers`.
  /// @param _tiers Array of new tiers to set (order matters).
  function setTiers(Tier[] memory _tiers) external onlyOwner {
    delete tiers;
    for (uint256 i = 0; i < _tiers.length; i++) {
      tiers.push(_tiers[i]);
      emit LogAddTier(_tiers[i]);
    }
  }

  /// @notice Set multiple callers as whitelisted or not.
  /// @param _callers Array of caller addresses.
  /// @param _isWhitelisteds Parallel array of booleans indicating whitelist status.
  function setWhitelistedCallers(address[] calldata _callers, bool[] calldata _isWhitelisteds) external onlyOwner {
    if (_callers.length != _isWhitelisteds.length) revert LQPHook_BadArgs();
    for (uint256 i = 0; i < _callers.length; ) {
      whitelistedCallers[_callers[i]] = _isWhitelisteds[i];
      emit LogSetWhitelistedCaller(_callers[i], _isWhitelisteds[i]);
      unchecked {
        ++i;
      }
    }
  }  

  /// -----------------------------------------------------------------------
  /// View / Utility
  /// -----------------------------------------------------------------------

  /// @notice Returns the timestamp at the start of the current epoch (aligned to `epochLength`).
  /// @return epochTimestamp Epoch-aligned timestamp (seconds).
  function getCurrentEpochTimestamp() public view returns (uint256 epochTimestamp) {
    unchecked {
      epochTimestamp = (block.timestamp / epochLength) * epochLength;
    }
  }

  /// @notice Returns the trade-volume-based multiplier (in bps) for `user` for the current epoch.
  /// @param user The user address to query.
  /// @return multiplier The multiplier in basis points for the user's weekly trade volume tier.
  function getWeeklyTradeVolumeMultiplier(address user) public view returns (uint256 multiplier) {
    uint256 epochTimestamp = getCurrentEpochTimestamp();
    uint256 tradeVolume = userTradeAmountE30[epochTimestamp][user];

    for (uint256 i = 0; i < tiers.length; i++) {
      if (tiers[i].minAmount <= tradeVolume && tradeVolume < tiers[i].maxAmount) {
        multiplier = tiers[i].multiplier;
        break;
      }
    }
  }

  /// @notice Compute overall multiplier applied to minted LQP for `user`.
  /// @dev Sum of base BPS, lock-up multiplier (from registry), and trade-volume multiplier.
  /// @param user The primary account to compute multiplier for.
  /// @return multiplier The total multiplier (in bps).
  function getMultiplier(address user) public view returns (uint256 multiplier) {
    // Note: registry returns multiple values; the third return is expected to be the lock-up multiplier in bps.
    ( , , uint256 lockUpMultiplier) = IBoostLockerRegistry(boostLockerRegistry).getLockUpValueAndMultiplier(user);
    uint256 tradeVolumeMultiplier = getWeeklyTradeVolumeMultiplier(user);

    multiplier = uint256(BPS) + lockUpMultiplier + tradeVolumeMultiplier;
  }
 
  /// -----------------------------------------------------------------------
  /// Hook callbacks (called by whitelisted trading services)
  /// -----------------------------------------------------------------------

  /// @notice Called by trading service when a position is increased.
  ///         Updates epoch trade volume and mints LQP to this contract.
  /// @param _primaryAccount Primary account who increased position.
  /// @param _marketIndex Market index (unused).
  /// @param _sizeDelta Size delta (trade amount) in E30 decimals.
  function onIncreasePosition(
    address _primaryAccount,
    uint256,
    uint256 _marketIndex,
    uint256 _sizeDelta,
    bytes32
  ) external onlyWhitelistedCaller {
    uint256 epochTimestamp = getCurrentEpochTimestamp();

    // Update user's epoch volume
    userTradeAmountE30[epochTimestamp][_primaryAccount] += _sizeDelta;
    emit LogEpochVolumeUpdated(_primaryAccount, epochTimestamp, userTradeAmountE30[epochTimestamp][_primaryAccount]);

    // Mint LQP according to computed multiplier
    uint256 multiplier = getMultiplier(_primaryAccount);
    _mintLQP(_primaryAccount, _sizeDelta, multiplier);

    emit LogMinted(_primaryAccount, _sizeDelta.mulDiv(multiplier, 1e16), multiplier, _sizeDelta, epochTimestamp);
  }

  function onDecreasePosition(
    address _primaryAccount,
    uint256,
    uint256,
    uint256 _sizeDelta,
    bytes32
  ) external onlyWhitelistedCaller {
    // Do nothing
  }

  /// -----------------------------------------------------------------------
  /// Internal helpers
  /// -----------------------------------------------------------------------

  /// @dev Calculate mint amount and call token mint. Math: _sizeDelta * _multiplier / 1e16.
  /// @param _primaryAccount Account referenced for context (not used as mint recipient in current design).
  /// @param _sizeDelta Trade size delta (E30).
  /// @param _multiplier Total multiplier in bps.
  function _mintLQP(address _primaryAccount, uint256 _sizeDelta, uint256 _multiplier) internal {
    // 1e16 chosen as (1e30 / 1e18) * BPS to normalize units and basis points.
    uint256 _mintAmount = _sizeDelta.mulDiv(_multiplier, 1e16);
    IMintableToken(lqp).mint(_primaryAccount, _mintAmount);
  }

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }
}
