// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

// interfaces
import { Owned } from "@hmx/base/Owned.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// interfaces
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { Address } from "@openzeppelin/contracts/utils/Address.sol";
import { IVaultStorage } from "@hmx/storages/interfaces/IVaultStorage.sol";

/// @title VaultStorage
/// @notice storage contract to do accounting for token, and also hold physical tokens
contract VaultStorage is Owned, ReentrancyGuard, IVaultStorage {
  using Address for address;
  using SafeERC20 for IERC20;

  /**
   * Modifiers
   */
  modifier onlyWhitelistedExecutor() {
    if (!serviceExecutors[msg.sender]) revert IVaultStorage_NotWhiteListed();
    _;
  }
  /**
   * Events
   */
  event LogSetTraderBalance(address indexed trader, address token, uint balance);
  event LogSetStrategyAllowanceOf(address indexed token, address strategy, address prevTarget, address newTarget);

  event SetServiceExecutor(address indexed executorAddress, bool isServiceExecutor);

  /**
   * States
   */
  uint256 public plpLiquidityDebtUSDE30; // USD dept accounting when fundingFee is not enough to repay to trader

  mapping(address => uint256) public totalAmount; //token => tokenAmount
  mapping(address => uint256) public plpLiquidity; // token => PLPTokenAmount
  mapping(address => uint256) public protocolFees; // protocol fee in token unit

  mapping(address => uint256) public fundingFee; // sum of realized funding fee when traders are settlement their protocolFees
  mapping(address => uint256) public devFees;

  // trader address (with sub-account) => token => amount
  mapping(address => mapping(address => uint256)) public traderBalances;
  // mapping(address => address[]) public traderTokens;
  mapping(address => address[]) public traderTokens;
  // mapping(token => strategy => target)
  mapping(address => mapping(address => address)) public strategyAllowanceOf;
  // mapping(service executor address => allow)
  mapping(address => bool) public serviceExecutors;

  /**
   * VALIDATION
   */

  function validateAddTraderToken(address _trader, address _token) public view {
    address[] storage traderToken = traderTokens[_trader];

    for (uint256 i; i < traderToken.length; ) {
      if (traderToken[i] == _token) revert IVaultStorage_TraderTokenAlreadyExists();
      unchecked {
        i++;
      }
    }
  }

  function validateRemoveTraderToken(address _trader, address _token) public view {
    if (traderBalances[_trader][_token] != 0) revert IVaultStorage_TraderBalanceRemaining();
  }

  /**
   * GETTER
   */

  function getTraderTokens(address _subAccount) external view returns (address[] memory) {
    return traderTokens[_subAccount];
  }

  function pullPLPLiquidity(address _token) external view returns (uint256) {
    return IERC20(_token).balanceOf(address(this)) - plpLiquidity[_token];
  }

  /**
   * ERC20 interaction functions
   */

  function pullToken(address _token) external returns (uint256) {
    uint256 prevBalance = totalAmount[_token];
    uint256 nextBalance = IERC20(_token).balanceOf(address(this));

    totalAmount[_token] = nextBalance;
    return nextBalance - prevBalance;
  }

  function pushToken(address _token, address _to, uint256 _amount) external nonReentrant onlyWhitelistedExecutor {
    IERC20(_token).safeTransfer(_to, _amount);
    totalAmount[_token] = IERC20(_token).balanceOf(address(this));
  }

  /**
   * SETTER
   */

  function setServiceExecutors(address _executorAddress, bool _isServiceExecutor) external nonReentrant onlyOwner {
    serviceExecutors[_executorAddress] = _isServiceExecutor;
    emit SetServiceExecutor(_executorAddress, _isServiceExecutor);
  }

  function addFee(address _token, uint256 _amount) external onlyWhitelistedExecutor {
    protocolFees[_token] += _amount;
  }

  function addDevFee(address _token, uint256 _amount) external onlyWhitelistedExecutor {
    devFees[_token] += _amount;
  }

  function addFundingFee(address _token, uint256 _amount) external onlyWhitelistedExecutor {
    fundingFee[_token] += _amount;
  }

  function removeFundingFee(address _token, uint256 _amount) external onlyWhitelistedExecutor {
    fundingFee[_token] -= _amount;
  }

  function addPlpLiquidityDebtUSDE30(uint256 _value) external onlyWhitelistedExecutor {
    plpLiquidityDebtUSDE30 += _value;
  }

  function removePlpLiquidityDebtUSDE30(uint256 _value) external onlyWhitelistedExecutor {
    plpLiquidityDebtUSDE30 -= _value;
  }

  function addPLPLiquidity(address _token, uint256 _amount) external onlyWhitelistedExecutor {
    plpLiquidity[_token] += _amount;
  }

  function withdrawFee(address _token, uint256 _amount, address _receiver) external onlyWhitelistedExecutor {
    if (_receiver == address(0)) revert IVaultStorage_ZeroAddress();
    protocolFees[_token] -= _amount;
    IERC20(_token).safeTransfer(_receiver, _amount);
  }

  function removePLPLiquidity(address _token, uint256 _amount) external onlyWhitelistedExecutor {
    plpLiquidity[_token] -= _amount;
  }

  function setTraderBalance(address _trader, address _token, uint256 _balance) external onlyWhitelistedExecutor {
    traderBalances[_trader][_token] = _balance;
    emit LogSetTraderBalance(_trader, _token, _balance);
  }

  function addTraderToken(address _trader, address _token) external onlyWhitelistedExecutor {
    validateAddTraderToken(_trader, _token);
    traderTokens[_trader].push(_token);
  }

  function removeTraderToken(address _trader, address _token) external onlyWhitelistedExecutor {
    validateRemoveTraderToken(_trader, _token);

    address[] storage traderToken = traderTokens[_trader];
    uint256 tokenLen = traderToken.length;
    uint256 lastTokenIndex = tokenLen - 1;

    // find and deregister the token
    for (uint256 i; i < tokenLen; ) {
      if (traderToken[i] == _token) {
        // delete the token by replacing it with the last one and then pop it from there
        if (i != lastTokenIndex) {
          traderToken[i] = traderToken[lastTokenIndex];
        }
        traderToken.pop();
        break;
      }

      unchecked {
        i++;
      }
    }
  }

  /**
   * Strategy
   */

  /// @notice Set the strategy for a token
  /// @param _token The token to set the strategy for
  /// @param _strategy The strategy to set
  /// @param _target The target to set
  function setStrategyAllowanceOf(address _token, address _strategy, address _target) external onlyOwner {
    emit LogSetStrategyAllowanceOf(_token, _strategy, strategyAllowanceOf[_token][_strategy], _target);
    strategyAllowanceOf[_token][_strategy] = _target;
  }

  function _getRevertMsg(bytes memory _returnData) internal pure returns (string memory) {
    // If the _res length is less than 68, then the transaction failed silently (without a revert message)
    if (_returnData.length < 68) return "Transaction reverted silently";
    assembly {
      // Slice the sighash.
      _returnData := add(_returnData, 0x04)
    }
    return abi.decode(_returnData, (string)); // All that remains is the revert string
  }

  function cook(address _target, address _token, bytes calldata _callData) external returns (bytes memory) {
    // Check
    // 1. Only strategy for specific token can call this function
    if (strategyAllowanceOf[_token][msg.sender] != _target) revert IVaultStorage_Forbidden();
    // 2. Target must be a contract. This to prevent strategy calling to EOA.
    if (!_target.isContract()) revert IVaultStorage_TargetNotContract();

    // 3. Execute the call as what the strategy wants
    (bool _success, bytes memory _returnData) = _target.call(_callData);
    // 4. Revert if not success
    require(_success, _getRevertMsg(_returnData));

    return _returnData;
  }

  /**
   * CALCULATION
   */
  // @todo - add only whitelisted services
  function transferToken(address _subAccount, address _token, uint256 _amount) external {
    IERC20(_token).safeTransfer(_subAccount, _amount);
  }

  // @todo - natSpec
  function removeAllTraderTokens(address _trader) external onlyWhitelistedExecutor {
    delete traderTokens[_trader];
  }

  /// @notice increase sub-account collateral
  /// @param _subAccount - sub account
  /// @param _token - collateral token to increase
  /// @param _amount - amount to increase
  function increaseTraderBalance(
    address _subAccount,
    address _token,
    uint256 _amount
  ) external onlyWhitelistedExecutor {
    traderBalances[_subAccount][_token] += _amount;
  }

  /// @notice decrease sub-account collateral
  /// @param _subAccount - sub account
  /// @param _token - collateral token to increase
  /// @param _amount - amount to increase
  function decreaseTraderBalance(
    address _subAccount,
    address _token,
    uint256 _amount
  ) external onlyWhitelistedExecutor {
    traderBalances[_subAccount][_token] -= _amount;
  }

  /// @notice Pays the PLP for providing liquidity with the specified token and amount.
  /// @param _trader The address of the trader paying the PLP.
  /// @param _token The address of the token being used to pay the PLP.
  /// @param _amount The amount of the token being used to pay the PLP.
  function payPlp(address _trader, address _token, uint256 _amount) external onlyWhitelistedExecutor {
    // Increase the PLP's liquidity for the specified token
    plpLiquidity[_token] += _amount;
    // Decrease the trader's balance for the specified token
    traderBalances[_trader][_token] -= _amount;
  }

  function payTradingFee(
    address _trader,
    address _token,
    uint256 _devFeeAmount,
    uint256 _protocolFeeAmount
  ) external onlyWhitelistedExecutor {
    // Deduct amount from trader balance
    traderBalances[_trader][_token] -= _devFeeAmount + _protocolFeeAmount;

    // Increase the amount to devFees and protocolFees
    devFees[_token] += _devFeeAmount;
    protocolFees[_token] += _protocolFeeAmount;
  }

  function payBorrowingFee(
    address _trader,
    address _token,
    uint256 _devFeeAmount,
    uint256 _plpFeeAmount
  ) external onlyWhitelistedExecutor {
    // Deduct amount from trader balance
    traderBalances[_trader][_token] -= _devFeeAmount + _plpFeeAmount;

    // Increase the amount to devFees and plpLiquidity
    devFees[_token] += _devFeeAmount;
    plpLiquidity[_token] += _plpFeeAmount;
  }

  function payFundingFeeFromTraderToPlp(
    address _trader,
    address _token,
    uint256 _fundingFeeAmount
  ) external onlyWhitelistedExecutor {
    // Deduct amount from trader balance
    traderBalances[_trader][_token] -= _fundingFeeAmount;

    // Increase the amount to plpLiquidity
    plpLiquidity[_token] += _fundingFeeAmount;
  }

  function payFundingFeeFromPlpToTrader(
    address _trader,
    address _token,
    uint256 _fundingFeeAmount
  ) external onlyWhitelistedExecutor {
    // Deduct amount from plpLiquidity
    plpLiquidity[_token] -= _fundingFeeAmount;

    // Increase the amount to trader
    traderBalances[_trader][_token] += _fundingFeeAmount;
  }
}
