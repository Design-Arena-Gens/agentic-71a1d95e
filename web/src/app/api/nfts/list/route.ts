import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const nfts = await prisma.nFT.findMany({ orderBy: { priceGold: 'asc' } });
  return NextResponse.json(nfts);
}
