/**
 * Smart Contract ABIs for Base Network interactions
 */

// ERC20 Standard ABI (for $OPENWORK)
export const ERC20_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Mint Club V2 Bond ABI
export const MCV2_BOND_ABI = [
  {
    inputs: [
      {
        components: [
          { name: 'name', type: 'string' },
          { name: 'symbol', type: 'string' },
        ],
        name: 'tokenParams',
        type: 'tuple',
      },
      {
        components: [
          { name: 'mintRoyalty', type: 'uint16' },
          { name: 'burnRoyalty', type: 'uint16' },
          { name: 'reserveToken', type: 'address' },
          { name: 'maxSupply', type: 'uint128' },
          { name: 'stepRanges', type: 'uint128[]' },
          { name: 'stepPrices', type: 'uint128[]' },
        ],
        name: 'bondParams',
        type: 'tuple',
      },
    ],
    name: 'createToken',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'tokenAddress', type: 'address' },
      { name: 'tokensToMint', type: 'uint256' },
      { name: 'maxReserveAmount', type: 'uint256' },
      { name: 'receiver', type: 'address' },
    ],
    name: 'mint',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'tokenAddress', type: 'address' },
      { name: 'tokensToBurn', type: 'uint256' },
      { name: 'minRefund', type: 'uint256' },
      { name: 'receiver', type: 'address' },
    ],
    name: 'burn',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenAddress', type: 'address' }],
    name: 'getReserveBalance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'tokenAddress', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'getMintPrice',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'tokenAddress', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'getBurnRefund',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;
