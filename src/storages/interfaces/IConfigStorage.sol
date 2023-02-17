// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

interface IConfigStorage {
  error ConfigStorage_NotWhiteListed();
  error ConfigStorage_ExceedLimitSetting();
  error ConfigStorage_BadLen();
  error ConfigStorage_BadArgs();
  // ERRORS
  error NotAcceptedCollateral();
  error NotWhiteListed();

  ////////////////////////////////////////////////////////////////////////////////////
  //////////////////////  STRUCT
  ////////////////////////////////////////////////////////////////////////////////////

  /// @notice perp liquidity provider token config
  struct PLPTokenConfig {
    uint256 decimals; //token decimals
    uint256 targetWeight; // pecentage of all accepted PLP tokens
    uint256 bufferLiquidity; // liquidity reserved for swapping, decimal is depends on token
    uint256 maxWeightDiff; // Maximum difference from the target weight in %
    bool isStableCoin; // token is stablecoin
    bool accepted; // accepted to provide liquidity
  }

  /// @notice collateral token config
  struct CollateralTokenConfig {
    uint256 decimals;
    uint256 collateralFactor; // token reliability factor to calculate buying power, 1e18 = 100%
    bool isStableCoin; // token is stablecoin
    bool accepted; // accepted to deposit as collateral
    address settleStrategy; // determine token will be settled for NON PLP collateral, e.g. aUSDC redeemed as USDC
  }

  struct MarketConfig {
    bytes32 assetId; // pyth network asset id
    uint256 assetClass; // Crypto = 1, Forex = 2, Stock = 3
    uint256 maxProfitRate; // maximum profit that trader could take per position
    uint256 longMaxOpenInterestUSDE30; // maximum to open long position
    uint256 shortMaxOpenInterestUSDE30; // maximum to open short position
    uint256 minLeverage; // minimum leverage that trader could open position
    uint256 initialMarginFraction; // IMF
    uint256 maintenanceMarginFraction; // MMF
    uint256 increasePositionFeeRate; // fee rate to increase position
    uint256 decreasePositionFeeRate; // fee rate to decrease position
    uint256 maxFundingRate; // maximum funding rate
    uint256 priceConfidentThreshold; // pyth price confidential treshold
    bool allowIncreasePosition; // allow trader to increase position
    bool active; // if active = false, means this market is delisted
  }

  struct AssetClassConfig {
    uint256 baseBorrowingRate;
  }

  // Liquidity
  struct LiquidityConfig {
    uint256 depositFeeRate; // PLP deposit fee rate
    uint256 withdrawFeeRate; // PLP withdraw fee rate
    uint256 maxPLPUtilization; //% of max utilization
    uint256 plpTotalTokenWeight; // % of token Weight (must be 1e18)
    uint256 plpSafetyBufferThreshold;
    uint256 taxFeeRate; // PLP deposit, withdraw, settle collect when pool weight is imbalances
    uint256 flashLoanFeeRate;
    bool dynamicFeeEnabled; // if disabled, swap, add or remove liquidity will exclude tax fee
    bool enabled; // Circuit breaker on Liquidity
  }

  // Swap
  struct SwapConfig {
    uint256 stablecoinSwapFeeRate;
    uint256 swapFeeRate;
  }

  // Trading
  struct TradingConfig {
    uint256 fundingInterval; // funding interval unit in seconds
    uint256 borrowingDevFeeRate;
  }

  // Liquidation
  struct LiquidationConfig {
    uint256 liquidationFeeUSDE30; // liquidation fee in USD
  }

  ////////////////////////////////////////////////////////////////////////////////////
  //////////////////////  STATE
  ////////////////////////////////////////////////////////////////////////////////////
  function plp() external view returns (address);

  function calculator() external view returns (address);

  function treasury() external view returns (address);

  function pnlFactor() external view returns (uint256);

  ////////////////////////////////////////////////////////////////////////////////////
  //////////////////////  VALIDATION
  ////////////////////////////////////////////////////////////////////////////////////

  /// @notice Validate only whitelisted executor contracts to be able to call Service contracts.
  /// @param _contractAddress Service contract address to be executed.
  /// @param _executorAddress Executor contract address to call service contract.
  function validateServiceExecutor(
    address _contractAddress,
    address _executorAddress
  ) external view;

  function validateAcceptedCollateral(address _token) external view;

  ////////////////////////////////////////////////////////////////////////////////////
  //////////////////////  GETTER
  ////////////////////////////////////////////////////////////////////////////////////

  function getMarketConfigByIndex(
    uint256 _index
  ) external view returns (MarketConfig memory _marketConfig);

  function getMarketConfigById(
    uint256 _marketIndex
  ) external view returns (MarketConfig memory _marketConfig);

  function getPlpTokenConfigs(
    address _token
  ) external view returns (PLPTokenConfig memory);

  function getCollateralTokenConfigs(
    address _token
  ) external view returns (CollateralTokenConfig memory _collateralTokenConfig);

  function getLiquidityConfig() external view returns (LiquidityConfig memory);

  function getLiquidationConfig()
    external
    view
    returns (LiquidationConfig memory);

  function getPLPTokenConfig(
    address _token
  ) external view returns (PLPTokenConfig memory);

  function getMarketConfigByToken(
    address _token
  ) external view returns (MarketConfig memory);

  function getMarketConfigsLength() external view returns (uint256);

  function getNextAcceptedToken(address token) external view returns (address);

  ////////////////////////////////////////////////////////////////////////////////////
  //////////////////////  SETTER
  ////////////////////////////////////////////////////////////////////////////////////

  function ITERABLE_ADDRESS_LIST_START() external view returns (address);

  function ITERABLE_ADDRESS_LIST_END() external view returns (address);

  // SETTER
  function setPLP(address _plp) external;

  function setPLPTotalTokenWeight(uint256 _totalTokenWeight) external;

  function setServiceExecutor(
    address _contractAddress,
    address _executorAddress,
    bool _isServiceExecutor
  ) external;

  function addMarketConfig(
    MarketConfig calldata _newConfig
  ) external returns (uint256 _index);

  function setLiquidityConfig(LiquidityConfig memory _newConfig) external;

  function setSwapConfig(SwapConfig memory _newConfig) external;

  function setTradingConfig(TradingConfig memory _newConfig) external;

  function setLiquidationConfig(LiquidationConfig memory _newConfig) external;

  function setMarketConfig(
    uint256 _marketIndex,
    MarketConfig memory _newConfig
  ) external returns (MarketConfig memory _marketConfig);

  function setPlpTokenConfig(
    address _token,
    PLPTokenConfig memory _newConfig
  ) external returns (PLPTokenConfig memory _plpTokenConfig);

  function setCollateralTokenConfig(
    address _token,
    CollateralTokenConfig memory _newConfig
  ) external returns (CollateralTokenConfig memory);
}
