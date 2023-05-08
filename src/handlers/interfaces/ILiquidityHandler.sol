// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

interface ILiquidityHandler {
  /**
   * Errors
   */
  error ILiquidityHandler_InvalidSender();
  error ILiquidityHandler_InsufficientExecutionFee();
  error ILiquidityHandler_InCorrectValueTransfer();
  error ILiquidityHandler_InsufficientRefund();
  error ILiquidityHandler_NotWhitelisted();
  error ILiquidityHandler_InvalidAddress();
  error ILiquidityHandler_NotExecutionState();
  error ILiquidityHandler_NoOrder();
  error ILiquidityHandler_NotOrderOwner();

  /**
   * Structs
   */
  struct LiquidityOrder {
    uint256 orderId;
    uint256 amount;
    uint256 minOut;
    uint256 executionFee;
    // slot
    address payable account;
    uint48 createdTimestamp;
    uint48 executedTimestamp;
    // slot
    address token;
    bool isAdd;
    bool isNativeOut; // token Out for remove liquidity(!unwrap) and refund addLiquidity (shoulWrap) flag
    uint8 status; // 0 = pending, 1 = execution success, 2 = execution fail
  }

  /**
   * Functions
   */
  function createAddLiquidityOrder(
    address _tokenBuy,
    uint256 _amountIn,
    uint256 _minOut,
    uint256 _executionFee,
    bool _shouldUnwrap
  ) external payable returns (uint256);

  function createRemoveLiquidityOrder(
    address _tokenSell,
    uint256 _amountIn,
    uint256 _minOut,
    uint256 _executionFee,
    bool _shouldUnwrap
  ) external payable returns (uint256);

  function executeOrder(
    uint256 _endIndex,
    address payable _feeReceiver,
    bytes32[] memory _priceData,
    bytes32[] memory _publishTimeData,
    uint256 _minPublishTime,
    bytes32 _encodedVaas
  ) external;

  function cancelLiquidityOrder(uint256 _orderIndex) external;

  function getLiquidityOrders() external view returns (LiquidityOrder[] memory);

  function nextExecutionOrderIndex() external view returns (uint256);

  function setOrderExecutor(address _executor, bool _isOk) external;

  function executeLiquidity(LiquidityOrder memory _order) external returns (uint256);
}
