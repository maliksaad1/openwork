/**
 * Treasury API
 * Fetches real $OPENWORK balance from Base network
 */

import { NextResponse } from 'next/server';

const OPENWORK_TOKEN = '0x299c30DD5974BF4D5bFE42C340CA40462816AB07';
const TREASURY_WALLET = process.env.TREASURY_WALLET_ADDRESS || '0x961E62856e43f8CB50a5540450903Cdd8e8D1844';

// ERC20 balanceOf ABI
const ERC20_BALANCE_ABI = 'balanceOf(address)';

interface TreasuryData {
  balance: string;
  balanceFormatted: string;
  walletAddress: string;
  tokenAddress: string;
  network: string;
  usdValue: string;
  lastUpdated: string;
}

async function getTokenBalance(): Promise<{ balance: bigint; decimals: number }> {
  try {
    // Use Base RPC to call balanceOf
    const response = await fetch('https://mainnet.base.org', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_call',
        params: [
          {
            to: OPENWORK_TOKEN,
            data: `0x70a08231000000000000000000000000${TREASURY_WALLET.slice(2)}`, // balanceOf(address)
          },
          'latest',
        ],
      }),
    });

    const data = await response.json();
    if (data.result) {
      return {
        balance: BigInt(data.result),
        decimals: 18, // Standard ERC20 decimals
      };
    }

    return { balance: BigInt(0), decimals: 18 };
  } catch (error) {
    console.error('Error fetching token balance:', error);
    return { balance: BigInt(0), decimals: 18 };
  }
}

async function getTokenPrice(): Promise<number> {
  try {
    // Try to get price from DEX Screener
    const response = await fetch(
      'https://api.dexscreener.com/latest/dex/tokens/0x299c30DD5974BF4D5bFE42C340CA40462816AB07',
      { cache: 'no-store' }
    );

    const data = await response.json();
    if (data.pairs && data.pairs.length > 0) {
      return parseFloat(data.pairs[0].priceUsd || '0.001255');
    }

    return 0.001255; // Fallback price
  } catch {
    return 0.001255; // Fallback price
  }
}

export async function GET() {
  const [{ balance, decimals }, price] = await Promise.all([
    getTokenBalance(),
    getTokenPrice(),
  ]);

  const balanceFormatted = Number(balance) / Math.pow(10, decimals);
  const usdValue = balanceFormatted * price;

  const treasuryData: TreasuryData = {
    balance: balance.toString(),
    balanceFormatted: balanceFormatted.toLocaleString('en-US', {
      maximumFractionDigits: 2,
    }),
    walletAddress: TREASURY_WALLET,
    tokenAddress: OPENWORK_TOKEN,
    network: 'Base',
    usdValue: usdValue.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    }),
    lastUpdated: new Date().toISOString(),
  };

  return NextResponse.json(treasuryData);
}
