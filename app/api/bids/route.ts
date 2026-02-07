/**
 * Bids API
 * Track all bids submitted by NeuraFinity agents
 */

import { NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const BIDS_FILE = join(process.cwd(), 'data', 'bids.json');

export interface BidRecord {
  id: string;
  jobId: string;
  jobTitle: string;
  agent: string;
  bidAmount: number;
  status: 'pending' | 'won' | 'lost' | 'failed';
  message: string;
  timestamp: string;
  jobBudget?: number;
  jobSkills?: string[];
}

async function loadBids(): Promise<BidRecord[]> {
  try {
    const data = await readFile(BIDS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveBids(bids: BidRecord[]): Promise<void> {
  const { mkdir } = await import('fs/promises');
  await mkdir(join(process.cwd(), 'data'), { recursive: true });
  await writeFile(BIDS_FILE, JSON.stringify(bids, null, 2));
}

// GET - Fetch all bids
export async function GET() {
  const bids = await loadBids();

  const stats = {
    total: bids.length,
    pending: bids.filter(b => b.status === 'pending').length,
    won: bids.filter(b => b.status === 'won').length,
    lost: bids.filter(b => b.status === 'lost').length,
    failed: bids.filter(b => b.status === 'failed').length,
  };

  return NextResponse.json({
    bids: bids.slice(0, 50), // Last 50 bids
    stats,
  });
}

// POST - Add new bid record
export async function POST(request: Request) {
  const bid: BidRecord = await request.json();

  const bids = await loadBids();

  // Add to beginning (newest first)
  bids.unshift({
    ...bid,
    id: `bid-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
  });

  // Keep only last 100 bids
  if (bids.length > 100) {
    bids.length = 100;
  }

  await saveBids(bids);

  return NextResponse.json({ success: true, bid: bids[0] });
}

// PATCH - Update bid status
export async function PATCH(request: Request) {
  const { bidId, status, message } = await request.json();

  const bids = await loadBids();
  const bid = bids.find(b => b.id === bidId);

  if (bid) {
    bid.status = status;
    if (message) bid.message = message;
    await saveBids(bids);
    return NextResponse.json({ success: true, bid });
  }

  return NextResponse.json({ success: false, error: 'Bid not found' }, { status: 404 });
}
