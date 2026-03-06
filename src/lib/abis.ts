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

export const AgentRouterMarketplaceABI = [
  { type: 'function', name: 'authorize', inputs: [{ name: 'strategyAgentId', type: 'uint256' }, { name: 'policy', type: 'tuple', components: [{ name: 'maxOrderSize', type: 'uint256' }, { name: 'maxDailyVolume', type: 'uint256' }, { name: 'allowedPools', type: 'address[]' }, { name: 'enabled', type: 'bool' }] }], outputs: [], stateMutability: 'nonpayable' },
  { type: 'function', name: 'revoke', inputs: [{ name: 'strategyAgentId', type: 'uint256' }], outputs: [], stateMutability: 'nonpayable' },
  { type: 'function', name: 'listOnMarketplace', inputs: [{ name: 'strategyAgentId', type: 'uint256' }], outputs: [], stateMutability: 'nonpayable' },
  { type: 'function', name: 'delistFromMarketplace', inputs: [{ name: 'strategyAgentId', type: 'uint256' }], outputs: [], stateMutability: 'nonpayable' },
] as const

export const ERC20ABI = [
  { type: 'function', name: 'decimals', inputs: [], outputs: [{ name: '', type: 'uint8' }], stateMutability: 'view' },
  { type: 'function', name: 'symbol', inputs: [], outputs: [{ name: '', type: 'string' }], stateMutability: 'view' },
  { type: 'function', name: 'balanceOf', inputs: [{ name: 'account', type: 'address' }], outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view' },
  { type: 'function', name: 'approve', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ name: '', type: 'bool' }], stateMutability: 'nonpayable' },
] as const
