/**
 * Base Network Client
 * Read-only blockchain interactions via viem
 */

import { createPublicClient, http, formatEther, formatUnits } from 'viem';
import { base } from 'viem/chains';
import { ERC20_ABI, MCV2_BOND_ABI } from './contracts';
import { CONTRACTS, type TreasuryBalance, type ContractAddresses } from './types';

// Public client for read operations
const publicClient = createPublicClient({
  chain: base,
  transport: http(process.env.BASE_RPC_URL ?? 'https://mainnet.base.org'),
});

export class BaseNetworkClient {
  private contracts: ContractAddresses;

  constructor(contracts: ContractAddresses = CONTRACTS) {
    this.contracts = contracts;
  }

  /**
   * Get treasury balance for a wallet
   */
  async getTreasuryBalance(walletAddress: `0x${string}`): Promise<TreasuryBalance> {
    const [openworkBalance, ethBalance] = await Promise.all([
      publicClient.readContract({
        address: this.contracts.OPENWORK,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [walletAddress],
      }),
      publicClient.getBalance({ address: walletAddress }),
    ]);

    return {
      openwork: openworkBalance,
      openworkFormatted: formatUnits(openworkBalance, 18),
      eth: ethBalance,
      ethFormatted: formatEther(ethBalance),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Check if wallet has minimum required $OPENWORK balance
   */
  async hasMinimumBalance(walletAddress: `0x${string}`): Promise<boolean> {
    const balance = await publicClient.readContract({
      address: this.contracts.OPENWORK,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [walletAddress],
    });

    const MINIMUM = 100000n * 10n ** 18n; // 100K tokens
    return balance >= MINIMUM;
  }

  /**
   * Get mint price for a bonding curve token
   */
  async getMintPrice(
    tokenAddress: `0x${string}`,
    amount: bigint
  ): Promise<bigint> {
    return publicClient.readContract({
      address: this.contracts.MCV2_Bond,
      abi: MCV2_BOND_ABI,
      functionName: 'getMintPrice',
      args: [tokenAddress, amount],
    });
  }

  /**
   * Get burn refund for a bonding curve token
   */
  async getBurnRefund(
    tokenAddress: `0x${string}`,
    amount: bigint
  ): Promise<bigint> {
    return publicClient.readContract({
      address: this.contracts.MCV2_Bond,
      abi: MCV2_BOND_ABI,
      functionName: 'getBurnRefund',
      args: [tokenAddress, amount],
    });
  }

  /**
   * Get reserve balance for a bonding curve token
   */
  async getReserveBalance(tokenAddress: `0x${string}`): Promise<bigint> {
    return publicClient.readContract({
      address: this.contracts.MCV2_Bond,
      abi: MCV2_BOND_ABI,
      functionName: 'getReserveBalance',
      args: [tokenAddress],
    });
  }

  /**
   * Get allowance for spending $OPENWORK
   */
  async getAllowance(
    owner: `0x${string}`,
    spender: `0x${string}`
  ): Promise<bigint> {
    return publicClient.readContract({
      address: this.contracts.OPENWORK,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [owner, spender],
    });
  }
}

// Singleton instance
let clientInstance: BaseNetworkClient | null = null;

export function getBaseClient(): BaseNetworkClient {
  if (!clientInstance) {
    clientInstance = new BaseNetworkClient();
  }
  return clientInstance;
}

export { publicClient };
