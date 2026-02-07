/**
 * GET /api/treasury/balance
 * Returns treasury balance and status
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get wallet address from query params or env
    const searchParams = request.nextUrl.searchParams;
    const wallet = searchParams.get('wallet') ?? process.env.TREASURY_WALLET_ADDRESS;

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet address required' },
        { status: 400 }
      );
    }

    // In production, this would call the Base Network client
    // const client = getBaseClient();
    // const balance = await client.getTreasuryBalance(wallet as `0x${string}`);

    // Mock balance for demo
    const balance = {
      openwork: '1250000000000000000000000', // 1.25M tokens
      openworkFormatted: '1,250,000',
      eth: '5000000000000000', // 0.005 ETH
      ethFormatted: '0.005',
      timestamp: new Date().toISOString(),
    };

    const minimumBalance = 100000;
    const hasMinimum = parseFloat(balance.openworkFormatted.replace(/,/g, '')) >= minimumBalance;

    return NextResponse.json({
      wallet,
      balance,
      hasMinimumBalance: hasMinimum,
      minimumRequired: minimumBalance,
      status: hasMinimum ? 'HEALTHY' : 'LOW_BALANCE',
    });
  } catch (error) {
    console.error('[TREASURY] Balance Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch balance' },
      { status: 500 }
    );
  }
}
