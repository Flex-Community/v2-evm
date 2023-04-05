// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

// base
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import { Owned } from "@hmx/base/Owned.sol";

// contracts
import { OracleMiddleware } from "@hmx/oracle/OracleMiddleware.sol";
import { TradeService } from "@hmx/services/TradeService.sol";
import { ConfigStorage } from "@hmx/storages/ConfigStorage.sol";
import { PerpStorage } from "@hmx/storages/PerpStorage.sol";

// interfaces
import { ILimitTradeHandler } from "./interfaces/ILimitTradeHandler.sol";
import { IWNative } from "../interfaces/IWNative.sol";
import { IPyth } from "pyth-sdk-solidity/IPyth.sol";

contract LimitTradeHandler is Owned, ReentrancyGuard, ILimitTradeHandler {
  /**
   * Events
   */
  event LogSetTradeService(address oldValue, address newValue);
  event LogSetMinExecutionFee(uint256 oldValue, uint256 newValue);
  event LogSetOrderExecutor(address executor, bool isAllow);
  event LogSetPyth(address oldValue, address newValue);
  event LogCreateLimitOrder(
    address indexed account,
    uint256 indexed subAccountId,
    uint256 orderIndex,
    uint256 marketIndex,
    int256 sizeDelta,
    uint256 triggerPrice,
    uint256 acceptablePrice,
    bool triggerAboveThreshold,
    uint256 executionFee,
    bool reduceOnly,
    address tpToken
  );
  event LogExecuteLimitOrder(
    address indexed account,
    uint256 indexed subAccountId,
    uint256 orderIndex,
    uint256 marketIndex,
    int256 sizeDelta,
    uint256 triggerPrice,
    bool triggerAboveThreshold,
    uint256 executionFee,
    uint256 executionPrice,
    bool reduceOnly,
    address tpToken
  );
  event LogUpdateLimitOrder(
    address indexed account,
    uint256 indexed subAccountId,
    uint256 orderIndex,
    int256 sizeDelta,
    uint256 triggerPrice,
    bool triggerAboveThreshold,
    bool reduceOnly,
    address tpToken
  );
  event LogCancelLimitOrder(
    address indexed account,
    uint256 indexed subAccountId,
    uint256 orderIndex,
    uint256 marketIndex,
    int256 sizeDelta,
    uint256 triggerPrice,
    bool triggerAboveThreshold,
    uint256 executionFee,
    bool reduceOnly,
    address tpToken
  );

  /**
   * Structs
   */

  struct ExecuteOrderVars {
    LimitOrder order;
    address subAccount;
    bytes32 positionId;
    bool positionIsLong;
    bool isNewPosition;
  }

  struct ValidatePositionOrderPriceVars {
    ConfigStorage.MarketConfig marketConfig;
    OracleMiddleware oracle;
    PerpStorage.Market globalMarket;
    uint256 oraclePrice;
    uint256 adaptivePrice;
    uint8 marketStatus;
    bool isPriceValid;
  }

  /**
   * Constants
   */
  uint8 internal constant BUY = 0;
  uint8 internal constant SELL = 1;
  uint256 internal MAX_EXECUTION_FEE = 5 ether;

  /**
   * States
   */
  address public weth;
  address public tradeService;
  address public pyth;
  uint256 public minExecutionFee; // Minimum execution fee to be collected by the order executor addresses for gas
  bool public isAllowAllExecutor; // If this is true, everyone can execute limit orders
  mapping(address => bool) public orderExecutors; // The allowed addresses to execute limit orders
  mapping(address => mapping(uint256 => LimitOrder)) public limitOrders; // Array of Limit Orders of each sub-account
  mapping(address => uint256) public limitOrdersIndex; // The last limit order index of each sub-account

  /**
   * Constructor
   */
  constructor(address _weth, address _tradeService, address _pyth, uint256 _minExecutionFee) {
    weth = _weth;
    tradeService = _tradeService;
    pyth = _pyth;
    isAllowAllExecutor = false;

    if (_minExecutionFee > MAX_EXECUTION_FEE) revert ILimitTradeHandler_MaxExecutionFee();
    minExecutionFee = _minExecutionFee;

    // slither-disable-next-line unused-return
    TradeService(_tradeService).perpStorage();
    // slither-disable-next-line unused-return
    IPyth(_pyth).getValidTimePeriod();
  }

  receive() external payable {
    if (msg.sender != weth) revert ILimitTradeHandler_InvalidSender();
  }

  /**
   * Modifiers
   */

  // Only whitelisted addresses can be able to execute limit orders
  modifier onlyOrderExecutor() {
    if (!isAllowAllExecutor && !orderExecutors[msg.sender]) revert ILimitTradeHandler_NotWhitelisted();
    _;
  }

  /**
   * Core Functions
   */
  /// @notice Create a new limit order
  /// @param _subAccountId Sub-account Id
  /// @param _marketIndex Market Index
  /// @param _sizeDelta How much the position size will change in USD (1e30), can be negative for INCREASE order
  /// @param _triggerPrice The price that this limit order will be triggered
  /// @param _triggerAboveThreshold The current price must go above/below the trigger price for the order to be executed
  /// @param _executionFee The execution fee of this limit order
  /// @param _reduceOnly If true, it's a Reduce-Only order which will not flip the side of the position
  /// @param _tpToken Take profit token, when trader has profit
  function createOrder(
    uint8 _subAccountId,
    uint256 _marketIndex,
    int256 _sizeDelta,
    uint256 _triggerPrice,
    uint256 _acceptablePrice,
    bool _triggerAboveThreshold,
    uint256 _executionFee,
    bool _reduceOnly,
    address _tpToken
  ) external payable nonReentrant {
    // Check if execution fee is lower than minExecutionFee, then it's too low. We won't allow it.
    if (_executionFee < minExecutionFee) revert ILimitTradeHandler_InsufficientExecutionFee();
    // The attached native token must be equal to _executionFee
    if (msg.value != _executionFee) revert ILimitTradeHandler_IncorrectValueTransfer();

    _validateCreateOrderPrice(_triggerAboveThreshold, _triggerPrice, _marketIndex, _sizeDelta, _sizeDelta > 0);

    // Transfer in the native token to be used as execution fee
    _transferInETH();

    address _subAccount = _getSubAccount(msg.sender, _subAccountId);
    uint256 _orderIndex = limitOrdersIndex[_subAccount];
    LimitOrder memory _order = LimitOrder({
      account: msg.sender,
      subAccountId: _subAccountId,
      marketIndex: _marketIndex,
      sizeDelta: _sizeDelta,
      triggerPrice: _triggerPrice,
      acceptablePrice: _acceptablePrice,
      triggerAboveThreshold: _triggerAboveThreshold,
      executionFee: _executionFee,
      reduceOnly: _reduceOnly,
      tpToken: _tpToken
    });

    // Insert the limit order into the list
    limitOrdersIndex[_subAccount] = _orderIndex + 1;
    limitOrders[_subAccount][_orderIndex] = _order;

    emit LogCreateLimitOrder(
      msg.sender,
      _subAccountId,
      _orderIndex,
      _marketIndex,
      _sizeDelta,
      _triggerPrice,
      _acceptablePrice,
      _triggerAboveThreshold,
      _executionFee,
      _reduceOnly,
      _tpToken
    );
  }

  /// @notice Execute a limit order
  /// @param _account the primary account of the order
  /// @param _subAccountId Sub-account Id
  /// @param _orderIndex Order Index which could be retrieved from the emitted event from `createOrder()`
  /// @param _feeReceiver Which address will receive the execution fee for this transaction
  /// @param _priceData Price data from Pyth to be used for updating the market prices
  function executeOrder(
    address _account,
    uint8 _subAccountId,
    uint256 _orderIndex,
    address payable _feeReceiver,
    bytes[] memory _priceData
  ) external nonReentrant onlyOrderExecutor {
    ExecuteOrderVars memory vars;

    vars.subAccount = _getSubAccount(_account, _subAccountId);
    vars.order = limitOrders[vars.subAccount][_orderIndex];

    // Delete this executed order from the list
    delete limitOrders[vars.subAccount][_orderIndex];

    // Check if this order still exists
    if (vars.order.account == address(0)) revert ILimitTradeHandler_NonExistentOrder();

    // Update price to Pyth
    // slither-disable-next-line arbitrary-send-eth
    uint256 _updateFee = IPyth(pyth).getUpdateFee(_priceData);
    IWNative(weth).withdraw(_updateFee);
    IPyth(pyth).updatePriceFeeds{ value: _updateFee }(_priceData);

    // Validate if the current price is valid for the execution of this order
    (uint256 _currentPrice, ) = _validatePositionOrderPrice(
      vars.order.triggerAboveThreshold,
      vars.order.triggerPrice,
      vars.order.acceptablePrice,
      vars.order.marketIndex,
      vars.order.sizeDelta,
      vars.order.sizeDelta > 0,
      true
    );

    // Retrieve existing position
    vars.positionId = _getPositionId(vars.subAccount, vars.order.marketIndex);
    PerpStorage.Position memory _existingPosition = PerpStorage(TradeService(tradeService).perpStorage())
      .getPositionById(vars.positionId);
    vars.positionIsLong = _existingPosition.positionSizeE30 > 0;
    vars.isNewPosition = _existingPosition.positionSizeE30 == 0;

    // Execute the order
    if (vars.order.sizeDelta > 0) {
      // BUY
      if (vars.isNewPosition || vars.positionIsLong) {
        // New position and Long position
        // just increase position when BUY
        TradeService(tradeService).increasePosition({
          _primaryAccount: _account,
          _subAccountId: _subAccountId,
          _marketIndex: vars.order.marketIndex,
          _sizeDelta: vars.order.sizeDelta,
          _limitPriceE30: vars.order.triggerPrice
        });
      } else if (!vars.positionIsLong) {
        bool _flipSide = !vars.order.reduceOnly && vars.order.sizeDelta > (-_existingPosition.positionSizeE30);
        if (_flipSide) {
          // Flip the position
          // Fully close Short position
          TradeService(tradeService).decreasePosition({
            _account: _account,
            _subAccountId: _subAccountId,
            _marketIndex: vars.order.marketIndex,
            _positionSizeE30ToDecrease: uint256(-_existingPosition.positionSizeE30),
            _tpToken: vars.order.tpToken,
            _limitPriceE30: vars.order.triggerPrice
          });
          // Flip it to Long position
          TradeService(tradeService).increasePosition({
            _primaryAccount: _account,
            _subAccountId: _subAccountId,
            _marketIndex: vars.order.marketIndex,
            _sizeDelta: vars.order.sizeDelta + _existingPosition.positionSizeE30,
            _limitPriceE30: vars.order.triggerPrice
          });
        } else {
          // Not flip
          TradeService(tradeService).decreasePosition({
            _account: _account,
            _subAccountId: _subAccountId,
            _marketIndex: vars.order.marketIndex,
            _positionSizeE30ToDecrease: _min(
              uint256(vars.order.sizeDelta),
              uint256(-_existingPosition.positionSizeE30)
            ),
            _tpToken: vars.order.tpToken,
            _limitPriceE30: vars.order.triggerPrice
          });
        }
      }
    } else if (vars.order.sizeDelta < 0) {
      // SELL
      if (vars.isNewPosition || !vars.positionIsLong) {
        // New position and Short position
        // just increase position when SELL
        TradeService(tradeService).increasePosition({
          _primaryAccount: _account,
          _subAccountId: _subAccountId,
          _marketIndex: vars.order.marketIndex,
          _sizeDelta: vars.order.sizeDelta,
          _limitPriceE30: vars.order.triggerPrice
        });
      } else if (vars.positionIsLong) {
        bool _flipSide = !vars.order.reduceOnly && (-vars.order.sizeDelta) > _existingPosition.positionSizeE30;
        if (_flipSide) {
          // Flip the position
          // Fully close Long position
          TradeService(tradeService).decreasePosition({
            _account: _account,
            _subAccountId: _subAccountId,
            _marketIndex: vars.order.marketIndex,
            _positionSizeE30ToDecrease: uint256(_existingPosition.positionSizeE30),
            _tpToken: vars.order.tpToken,
            _limitPriceE30: vars.order.triggerPrice
          });
          // Flip it to Short position
          TradeService(tradeService).increasePosition({
            _primaryAccount: _account,
            _subAccountId: _subAccountId,
            _marketIndex: vars.order.marketIndex,
            _sizeDelta: vars.order.sizeDelta + _existingPosition.positionSizeE30,
            _limitPriceE30: vars.order.triggerPrice
          });
        } else {
          // Not flip
          TradeService(tradeService).decreasePosition({
            _account: _account,
            _subAccountId: _subAccountId,
            _marketIndex: vars.order.marketIndex,
            _positionSizeE30ToDecrease: _min(
              uint256(-vars.order.sizeDelta),
              uint256(_existingPosition.positionSizeE30)
            ),
            _tpToken: vars.order.tpToken,
            _limitPriceE30: vars.order.triggerPrice
          });
        }
      }
    }

    // Pay the executor
    _transferOutETH(vars.order.executionFee - _updateFee, _feeReceiver);

    emit LogExecuteLimitOrder(
      _account,
      _subAccountId,
      _orderIndex,
      vars.order.marketIndex,
      vars.order.sizeDelta,
      vars.order.triggerPrice,
      vars.order.triggerAboveThreshold,
      vars.order.executionFee,
      _currentPrice,
      vars.order.reduceOnly,
      vars.order.tpToken
    );
  }

  /// @notice Cancel a limit order
  /// @param _subAccountId Sub-account Id
  /// @param _orderIndex Order Index which could be retrieved from the emitted event from `createOrder()`
  function cancelOrder(uint8 _subAccountId, uint256 _orderIndex) external nonReentrant {
    address subAccount = _getSubAccount(msg.sender, _subAccountId);
    LimitOrder memory _order = limitOrders[subAccount][_orderIndex];
    // Check if this order still exists
    if (_order.account == address(0)) revert ILimitTradeHandler_NonExistentOrder();

    // Delete this order from the list
    delete limitOrders[subAccount][_orderIndex];

    // Refund the execution fee to the creator of this order
    _transferOutETH(_order.executionFee, _order.account);

    emit LogCancelLimitOrder(
      _order.account,
      _subAccountId,
      _orderIndex,
      _order.marketIndex,
      _order.sizeDelta,
      _order.triggerPrice,
      _order.triggerAboveThreshold,
      _order.executionFee,
      _order.reduceOnly,
      _order.tpToken
    );
  }

  /// @notice Update a limit order
  /// @param _subAccountId Sub-account Id
  /// @param _orderIndex Order Index which could be retrieved from the emitted event from `createOrder()`
  /// @param _sizeDelta How much the position size will change in USD (1e30), can be negative for INCREASE order
  /// @param _triggerPrice The price that this limit order will be triggered
  /// @param _triggerAboveThreshold The current price must go above/below the trigger price for the order to be executed
  /// @param _reduceOnly If true, it's a Reduce-Only order which will not flip the side of the position
  /// @param _tpToken Take profit token, when trader has profit
  function updateOrder(
    uint8 _subAccountId,
    uint256 _orderIndex,
    int256 _sizeDelta,
    uint256 _triggerPrice,
    bool _triggerAboveThreshold,
    bool _reduceOnly,
    address _tpToken
  ) external nonReentrant {
    address subAccount = _getSubAccount(msg.sender, _subAccountId);
    LimitOrder storage _order = limitOrders[subAccount][_orderIndex];
    // Check if this order still exists
    if (_order.account == address(0)) revert ILimitTradeHandler_NonExistentOrder();

    // Update order
    _order.triggerPrice = _triggerPrice;
    _order.triggerAboveThreshold = _triggerAboveThreshold;
    _order.sizeDelta = _sizeDelta;
    _order.reduceOnly = _reduceOnly;
    _order.tpToken = _tpToken;

    emit LogUpdateLimitOrder(
      _order.account,
      _order.subAccountId,
      _orderIndex,
      _order.sizeDelta,
      _order.triggerPrice,
      _order.triggerAboveThreshold,
      _order.reduceOnly,
      _order.tpToken
    );
  }

  /**
   * Setters
   */
  function setTradeService(address _newTradeService) external onlyOwner {
    if (_newTradeService == address(0)) revert ILimitTradeHandler_InvalidAddress();
    TradeService(_newTradeService).perpStorage();
    emit LogSetTradeService(address(tradeService), _newTradeService);
    tradeService = _newTradeService;
  }

  function setMinExecutionFee(uint256 _newMinExecutionFee) external onlyOwner {
    if (_newMinExecutionFee > MAX_EXECUTION_FEE) revert ILimitTradeHandler_MaxExecutionFee();
    emit LogSetMinExecutionFee(minExecutionFee, _newMinExecutionFee);
    minExecutionFee = _newMinExecutionFee;
  }

  function setOrderExecutor(address _executor, bool _isAllow) external onlyOwner {
    orderExecutors[_executor] = _isAllow;
    emit LogSetOrderExecutor(_executor, _isAllow);
  }

  function setPyth(address _newPyth) external onlyOwner {
    if (_newPyth == address(0)) revert ILimitTradeHandler_InvalidAddress();
    IPyth(_newPyth).getValidTimePeriod();
    emit LogSetPyth(address(tradeService), _newPyth);
    pyth = _newPyth;
  }

  /**
   * Internal Functions
   */

  function _validatePositionOrderPrice(
    bool _triggerAboveThreshold,
    uint256 _triggerPrice,
    uint256 _acceptablePrice,
    uint256 _marketIndex,
    int256 _sizeDelta,
    bool _maximizePrice,
    bool _revertOnError
  ) internal view returns (uint256, bool) {
    ValidatePositionOrderPriceVars memory vars;

    // Get price from Pyth
    vars.marketConfig = ConfigStorage(TradeService(tradeService).configStorage()).getMarketConfigByIndex(_marketIndex);
    vars.oracle = OracleMiddleware(ConfigStorage(TradeService(tradeService).configStorage()).oracle());
    vars.globalMarket = PerpStorage(TradeService(tradeService).perpStorage()).getMarketByIndex(_marketIndex);

    // Validate trigger price with oracle price
    (vars.oraclePrice, ) = vars.oracle.getLatestPrice(vars.marketConfig.assetId, true);
    vars.isPriceValid = _triggerAboveThreshold ? vars.oraclePrice > _triggerPrice : vars.oraclePrice < _triggerPrice;

    if (_revertOnError) {
      if (!vars.isPriceValid) revert ILimitTradeHandler_InvalidPriceForExecution();
    }

    // Validate acceptable price with adaptive price
    (vars.adaptivePrice, , , vars.marketStatus) = vars.oracle.getLatestAdaptivePriceWithMarketStatus(
      vars.marketConfig.assetId,
      _maximizePrice,
      (int(vars.globalMarket.longPositionSize) - int(vars.globalMarket.shortPositionSize)),
      _sizeDelta,
      vars.marketConfig.fundingRate.maxSkewScaleUSD,
      _triggerPrice
    );

    // Validate market status
    if (vars.marketStatus != 2) {
      if (_revertOnError) revert ILimitTradeHandler_MarketIsClosed();
      else return (vars.adaptivePrice, false);
    }

    // Validate price is executable
    vars.isPriceValid = _triggerAboveThreshold
      ? vars.adaptivePrice < _acceptablePrice
      : vars.adaptivePrice > _acceptablePrice;

    if (_revertOnError) {
      if (!vars.isPriceValid) revert ILimitTradeHandler_InvalidPriceForExecution();
    }

    return (vars.adaptivePrice, vars.isPriceValid);
  }

  function _validateCreateOrderPrice(
    bool _triggerAboveThreshold,
    uint256 _triggerPrice,
    uint256 _marketIndex,
    int256 _sizeDelta,
    bool _maximizePrice
  ) internal view returns (uint256 _currentPrice, bool _isPriceValid) {
    ValidatePositionOrderPriceVars memory vars;

    // Get price from Pyth
    vars.marketConfig = ConfigStorage(TradeService(tradeService).configStorage()).getMarketConfigByIndex(_marketIndex);
    vars.oracle = OracleMiddleware(ConfigStorage(TradeService(tradeService).configStorage()).oracle());
    vars.globalMarket = PerpStorage(TradeService(tradeService).perpStorage()).getMarketByIndex(_marketIndex);

    (_currentPrice, , , ) = vars.oracle.getLatestAdaptivePriceWithMarketStatus(
      vars.marketConfig.assetId,
      _maximizePrice,
      (int(vars.globalMarket.longPositionSize) - int(vars.globalMarket.shortPositionSize)),
      _sizeDelta,
      vars.marketConfig.fundingRate.maxSkewScaleUSD,
      0
    );

    if (_triggerAboveThreshold) {
      if (_triggerPrice <= _currentPrice) {
        revert ILimitTradeHandler_TriggerPriceBelowCurrentPrice();
      }
    } else {
      if (_triggerPrice >= _currentPrice) {
        revert ILimitTradeHandler_TriggerPriceAboveCurrentPrice();
      }
    }

    _isPriceValid = true;
    return (_currentPrice, _isPriceValid);
  }

  /// @notice Transfer in ETH from user to be used as execution fee
  /// @dev The received ETH will be wrapped into WETH and store in this contract for later use.
  function _transferInETH() private {
    IWNative(weth).deposit{ value: msg.value }();
  }

  /// @notice Transfer out ETH to the receiver
  /// @dev The stored WETH will be unwrapped and transfer as native token
  /// @param _amountOut Amount of ETH to be transferred
  /// @param _receiver The receiver of ETH in its native form. The receiver must be able to accept native token.
  function _transferOutETH(uint256 _amountOut, address _receiver) private {
    IWNative(weth).withdraw(_amountOut);
    // slither-disable-next-line arbitrary-send-eth
    payable(_receiver).transfer(_amountOut);
  }

  /// @notice Derive sub-account from primary account and sub-account id
  function _getSubAccount(address primary, uint8 subAccountId) internal pure returns (address) {
    if (subAccountId > 255) revert ILimitTradeHandler_BadSubAccountId();
    return address(uint160(primary) ^ uint160(subAccountId));
  }

  /// @notice Derive positionId from sub-account and market index
  function _getPositionId(address _subAccount, uint256 _marketIndex) internal pure returns (bytes32) {
    return keccak256(abi.encodePacked(_subAccount, _marketIndex));
  }

  function _min(uint256 x, uint256 y) internal pure returns (uint256) {
    return x < y ? x : y;
  }
}
