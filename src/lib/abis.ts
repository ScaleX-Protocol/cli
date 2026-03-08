/**
 * Minimal ABI definitions for ScaleX smart contracts.
 * Adapted from scalex-8004/src/core/abis.ts
 */

export const RouterABI = [
  { type: 'function', name: 'deposit', inputs: [{ name: 'token', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [], stateMutability: 'nonpayable' },
  { type: 'function', name: 'withdraw', inputs: [{ name: '', type: 'address' }, { name: '', type: 'uint256' }], outputs: [], stateMutability: 'nonpayable' },
  { type: 'function', name: 'borrow', inputs: [{ name: 'token', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [], stateMutability: 'nonpayable' },
  { type: 'function', name: 'repay', inputs: [{ name: 'token', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [], stateMutability: 'nonpayable' },
  { type: 'function', name: 'cancelOrder', inputs: [{ name: 'pool', type: 'tuple', components: [{ name: 'baseCurrency', type: 'address' }, { name: 'quoteCurrency', type: 'address' }, { name: 'orderBook', type: 'address' }] }, { name: 'orderId', type: 'uint48' }], outputs: [], stateMutability: 'nonpayable' },
] as const

export const BalanceManagerABI = [
  { type: 'function', name: 'getBalance', inputs: [{ name: 'user', type: 'address' }, { name: 'currency', type: 'address' }], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'getAvailableBalance', inputs: [{ name: 'user', type: 'address' }, { name: 'currency', type: 'address' }], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'deposit', inputs: [{ name: 'currency', type: 'address' }, { name: 'amount', type: 'uint256' }, { name: 'sender', type: 'address' }, { name: 'user', type: 'address' }], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'payable' },
  { type: 'function', name: 'withdraw', inputs: [{ name: 'currency', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [], stateMutability: 'nonpayable' },
] as const

export const PoolManagerABI = [
  {
    type: 'function', name: 'getPool',
    inputs: [{ name: 'key', type: 'tuple', components: [{ name: 'baseCurrency', type: 'address' }, { name: 'quoteCurrency', type: 'address' }] }],
    outputs: [{ name: '', type: 'tuple', components: [{ name: 'baseCurrency', type: 'address' }, { name: 'quoteCurrency', type: 'address' }, { name: 'orderBook', type: 'address' }] }],
    stateMutability: 'view',
  },
] as const

export const PricePredictionABI = [
  { type: 'function', name: 'predict', inputs: [{ name: 'marketId', type: 'uint64' }, { name: 'predictUp', type: 'bool' }, { name: 'amount', type: 'uint256' }], outputs: [], stateMutability: 'nonpayable' },
  { type: 'function', name: 'claim', inputs: [{ name: 'marketId', type: 'uint64' }], outputs: [], stateMutability: 'nonpayable' },
  { type: 'function', name: 'claimBatch', inputs: [{ name: 'marketIds', type: 'uint64[]' }], outputs: [], stateMutability: 'nonpayable' },
] as const

export const AgentRouterTradingABI = [
  {
    type: 'function', name: 'executeSelfLimitOrder',
    inputs: [
      { name: 'strategyAgentId', type: 'uint256' },
      { name: 'pool', type: 'tuple', components: [{ name: 'baseCurrency', type: 'address' }, { name: 'quoteCurrency', type: 'address' }, { name: 'orderBook', type: 'address' }] },
      { name: 'price', type: 'uint128' },
      { name: 'quantity', type: 'uint128' },
      { name: 'side', type: 'uint8' },
      { name: 'timeInForce', type: 'uint8' },
    ],
    outputs: [{ name: 'orderId', type: 'uint48' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function', name: 'executeSelfMarketOrder',
    inputs: [
      { name: 'strategyAgentId', type: 'uint256' },
      { name: 'pool', type: 'tuple', components: [{ name: 'baseCurrency', type: 'address' }, { name: 'quoteCurrency', type: 'address' }, { name: 'orderBook', type: 'address' }] },
      { name: 'side', type: 'uint8' },
      { name: 'quantity', type: 'uint128' },
      { name: 'minOutAmount', type: 'uint128' },
    ],
    outputs: [{ name: 'orderId', type: 'uint48' }, { name: 'filled', type: 'uint128' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function', name: 'cancelSelfOrder',
    inputs: [
      { name: 'strategyAgentId', type: 'uint256' },
      { name: 'pool', type: 'tuple', components: [{ name: 'baseCurrency', type: 'address' }, { name: 'quoteCurrency', type: 'address' }, { name: 'orderBook', type: 'address' }] },
      { name: 'orderId', type: 'uint48' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function', name: 'executeLimitOrder',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'strategyAgentId', type: 'uint256' },
      { name: 'pool', type: 'tuple', components: [{ name: 'baseCurrency', type: 'address' }, { name: 'quoteCurrency', type: 'address' }, { name: 'orderBook', type: 'address' }] },
      { name: 'price', type: 'uint128' },
      { name: 'quantity', type: 'uint128' },
      { name: 'side', type: 'uint8' },
      { name: 'timeInForce', type: 'uint8' },
      { name: 'autoRepay', type: 'bool' },
      { name: 'autoBorrow', type: 'bool' },
    ],
    outputs: [{ name: 'orderId', type: 'uint48' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function', name: 'executeMarketOrder',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'strategyAgentId', type: 'uint256' },
      { name: 'pool', type: 'tuple', components: [{ name: 'baseCurrency', type: 'address' }, { name: 'quoteCurrency', type: 'address' }, { name: 'orderBook', type: 'address' }] },
      { name: 'side', type: 'uint8' },
      { name: 'quantity', type: 'uint128' },
      { name: 'minOutAmount', type: 'uint128' },
      { name: 'autoRepay', type: 'bool' },
      { name: 'autoBorrow', type: 'bool' },
    ],
    outputs: [{ name: 'orderId', type: 'uint48' }, { name: 'filled', type: 'uint128' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function', name: 'cancelOrder',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'strategyAgentId', type: 'uint256' },
      { name: 'pool', type: 'tuple', components: [{ name: 'baseCurrency', type: 'address' }, { name: 'quoteCurrency', type: 'address' }, { name: 'orderBook', type: 'address' }] },
      { name: 'orderId', type: 'uint48' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const

export const AgentRouterPredictionABI = [
  { type: 'function', name: 'selfPredict', inputs: [{ name: 'strategyAgentId', type: 'uint256' }, { name: 'marketId', type: 'uint64' }, { name: 'predictUp', type: 'bool' }, { name: 'amount', type: 'uint256' }], outputs: [], stateMutability: 'nonpayable' },
  { type: 'function', name: 'selfClaimPrediction', inputs: [{ name: 'strategyAgentId', type: 'uint256' }, { name: 'marketId', type: 'uint64' }], outputs: [], stateMutability: 'nonpayable' },
  { type: 'function', name: 'executePredict', inputs: [{ name: 'user', type: 'address' }, { name: 'strategyAgentId', type: 'uint256' }, { name: 'marketId', type: 'uint64' }, { name: 'predictUp', type: 'bool' }, { name: 'amount', type: 'uint256' }], outputs: [], stateMutability: 'nonpayable' },
  { type: 'function', name: 'executeClaimPrediction', inputs: [{ name: 'user', type: 'address' }, { name: 'strategyAgentId', type: 'uint256' }, { name: 'marketId', type: 'uint64' }], outputs: [], stateMutability: 'nonpayable' },
] as const

export const AgentRouterLendingABI = [
  { type: 'function', name: 'executeBorrow', inputs: [{ name: 'user', type: 'address' }, { name: 'strategyAgentId', type: 'uint256' }, { name: 'token', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [], stateMutability: 'nonpayable' },
  { type: 'function', name: 'executeRepay', inputs: [{ name: 'user', type: 'address' }, { name: 'strategyAgentId', type: 'uint256' }, { name: 'token', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [], stateMutability: 'nonpayable' },
  { type: 'function', name: 'executeSupplyCollateral', inputs: [{ name: 'user', type: 'address' }, { name: 'strategyAgentId', type: 'uint256' }, { name: 'token', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [], stateMutability: 'nonpayable' },
  { type: 'function', name: 'executeWithdrawCollateral', inputs: [{ name: 'user', type: 'address' }, { name: 'strategyAgentId', type: 'uint256' }, { name: 'token', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [], stateMutability: 'nonpayable' },
  { type: 'function', name: 'selfBorrow', inputs: [{ name: 'strategyAgentId', type: 'uint256' }, { name: 'token', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [], stateMutability: 'nonpayable' },
  { type: 'function', name: 'selfRepay', inputs: [{ name: 'strategyAgentId', type: 'uint256' }, { name: 'token', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [], stateMutability: 'nonpayable' },
] as const

// Policy tuple components — must match PolicyFactoryStorage.Policy struct field order exactly.
// Source: clob-dex/src/ai-agents/storages/PolicyFactoryStorage.sol lines 17–105
const POLICY_COMPONENTS = [
  // Metadata
  { name: 'enabled',                      type: 'bool'      },
  { name: 'installedAt',                  type: 'uint256'   },
  { name: 'expiryTimestamp',              type: 'uint256'   },
  // Order Size
  { name: 'maxOrderSize',                 type: 'uint256'   },
  { name: 'minOrderSize',                 type: 'uint256'   },
  // Allowed Markets
  { name: 'whitelistedTokens',            type: 'address[]' },
  { name: 'blacklistedTokens',            type: 'address[]' },
  // Order Types
  { name: 'allowMarketOrders',            type: 'bool'      },
  { name: 'allowLimitOrders',             type: 'bool'      },
  // Operations
  { name: 'allowSwap',                    type: 'bool'      },
  { name: 'allowBorrow',                  type: 'bool'      },
  { name: 'allowRepay',                   type: 'bool'      },
  { name: 'allowSupplyCollateral',        type: 'bool'      },
  { name: 'allowWithdrawCollateral',      type: 'bool'      },
  { name: 'allowPlaceLimitOrder',         type: 'bool'      },
  { name: 'allowCancelOrder',             type: 'bool'      },
  // Prediction
  { name: 'allowPredict',                 type: 'bool'      },
  { name: 'allowClaimPrediction',         type: 'bool'      },
  { name: 'maxPredictionStake',           type: 'uint256'   },
  // Buy/Sell Direction
  { name: 'allowBuy',                     type: 'bool'      },
  { name: 'allowSell',                    type: 'bool'      },
  // Auto-Borrow
  { name: 'allowAutoBorrow',              type: 'bool'      },
  { name: 'maxAutoBorrowAmount',          type: 'uint256'   },
  // Auto-Repay
  { name: 'allowAutoRepay',               type: 'bool'      },
  { name: 'minDebtToRepay',              type: 'uint256'   },
  // Safety
  { name: 'minHealthFactor',             type: 'uint256'   },
  { name: 'maxSlippageBps',              type: 'uint256'   },
  { name: 'minTimeBetweenTrades',        type: 'uint256'   },
  { name: 'emergencyRecipient',          type: 'address'   },
  // Volume Limits
  { name: 'dailyVolumeLimit',            type: 'uint256'   },
  { name: 'weeklyVolumeLimit',           type: 'uint256'   },
  // Drawdown Limits
  { name: 'maxDailyDrawdown',            type: 'uint256'   },
  { name: 'maxWeeklyDrawdown',           type: 'uint256'   },
  // Market Depth
  { name: 'maxTradeVsTVLBps',            type: 'uint256'   },
  // Performance Requirements
  { name: 'minWinRateBps',               type: 'uint256'   },
  { name: 'minSharpeRatio',              type: 'int256'    },
  // Position Management
  { name: 'maxPositionConcentrationBps', type: 'uint256'   },
  { name: 'maxCorrelationBps',           type: 'uint256'   },
  // Trade Frequency
  { name: 'maxTradesPerDay',             type: 'uint256'   },
  { name: 'maxTradesPerHour',            type: 'uint256'   },
  // Trading Hours
  { name: 'tradingStartHour',            type: 'uint256'   },
  { name: 'tradingEndHour',              type: 'uint256'   },
  // Reputation
  { name: 'minReputationScore',          type: 'uint256'   },
  { name: 'useReputationMultiplier',     type: 'bool'      },
  // Optimization Flag
  { name: 'requiresChainlinkFunctions',  type: 'bool'      },
] as const

export const AgentRouterMarketplaceABI = [
  {
    type: 'function', name: 'authorize',
    inputs: [
      { name: 'strategyAgentId', type: 'uint256' },
      { name: 'policy', type: 'tuple', components: POLICY_COMPONENTS },
    ],
    outputs: [], stateMutability: 'nonpayable',
  },
  { type: 'function', name: 'revoke', inputs: [{ name: 'strategyAgentId', type: 'uint256' }], outputs: [], stateMutability: 'nonpayable' },
  { type: 'function', name: 'listOnMarketplace', inputs: [{ name: 'strategyAgentId', type: 'uint256' }], outputs: [], stateMutability: 'nonpayable' },
  { type: 'function', name: 'delistFromMarketplace', inputs: [{ name: 'strategyAgentId', type: 'uint256' }], outputs: [], stateMutability: 'nonpayable' },
] as const

// Pool tuple reused across CRE functions
const POOL_COMPONENTS = [
  { name: 'baseCurrency',  type: 'address' },
  { name: 'quoteCurrency', type: 'address' },
  { name: 'orderBook',     type: 'address' },
] as const

// PendingOrder struct returned by getPendingOrder
// Source: clob-dex/src/ai-agents/storages/AgentRouterStorage.sol
const PENDING_ORDER_COMPONENTS = [
  { name: 'user',             type: 'address' },
  { name: 'strategyAgentId', type: 'uint256'  },
  { name: 'orderBook',       type: 'address'  },
  { name: 'baseCurrency',    type: 'address'  },
  { name: 'quoteCurrency',   type: 'address'  },
  { name: 'side',            type: 'uint8'    },
  { name: 'quantity',        type: 'uint128'  },
  { name: 'price',           type: 'uint128'  },
  { name: 'timeInForce',     type: 'uint8'    },
  { name: 'isMarketOrder',   type: 'bool'     },
  { name: 'autoRepay',       type: 'bool'     },
  { name: 'autoBorrow',      type: 'bool'     },
  { name: 'lockedCurrency',  type: 'address'  },
  { name: 'lockedAmount',    type: 'uint256'  },
  { name: 'queuedAt',        type: 'uint256'  },
  { name: 'active',          type: 'bool'     },
] as const

// CRE (Chainlink Functions) queue functions — only usable when policy.requiresChainlinkFunctions = true
// Source: clob-dex/src/ai-agents/AgentRouter.sol (added in commit ecc7437)
export const AgentRouterCREABI = [
  {
    type: 'function', name: 'queueMarketOrder',
    inputs: [
      { name: 'user',            type: 'address' },
      { name: 'strategyAgentId', type: 'uint256' },
      { name: 'pool',            type: 'tuple', components: POOL_COMPONENTS },
      { name: 'side',            type: 'uint8'   },
      { name: 'quantity',        type: 'uint128' },
      { name: 'minOutAmount',    type: 'uint128' },
      { name: 'autoRepay',       type: 'bool'    },
      { name: 'autoBorrow',      type: 'bool'    },
    ],
    outputs: [{ name: 'pendingOrderId', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function', name: 'queueLimitOrder',
    inputs: [
      { name: 'user',            type: 'address' },
      { name: 'strategyAgentId', type: 'uint256' },
      { name: 'pool',            type: 'tuple', components: POOL_COMPONENTS },
      { name: 'price',           type: 'uint128' },
      { name: 'quantity',        type: 'uint128' },
      { name: 'side',            type: 'uint8'   },
      { name: 'timeInForce',     type: 'uint8'   },
      { name: 'autoRepay',       type: 'bool'    },
      { name: 'autoBorrow',      type: 'bool'    },
    ],
    outputs: [{ name: 'pendingOrderId', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function', name: 'cancelPendingOrder',
    inputs: [{ name: 'pendingOrderId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function', name: 'getPendingOrder',
    inputs: [{ name: 'pendingOrderId', type: 'uint256' }],
    outputs: [{ name: '', type: 'tuple', components: PENDING_ORDER_COMPONENTS }],
    stateMutability: 'view',
  },
] as const

export const ERC20ABI = [
  { type: 'function', name: 'decimals', inputs: [], outputs: [{ name: '', type: 'uint8' }], stateMutability: 'view' },
  { type: 'function', name: 'symbol', inputs: [], outputs: [{ name: '', type: 'string' }], stateMutability: 'view' },
  { type: 'function', name: 'balanceOf', inputs: [{ name: 'account', type: 'address' }], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'approve', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ name: '', type: 'bool' }], stateMutability: 'nonpayable' },
] as const
