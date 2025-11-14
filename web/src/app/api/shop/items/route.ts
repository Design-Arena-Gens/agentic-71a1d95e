import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const items = await prisma.shopItem.findMany({ orderBy: { priceGold: 'asc' } });
  return NextResponse.json(items);
}
