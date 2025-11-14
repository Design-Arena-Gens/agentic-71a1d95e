import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getOrCreateSettings } from '@/lib/settings';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const s = await getOrCreateSettings();
  return NextResponse.json(s);
}

export async function POST(req: NextRequest) {
  const me = await getSession();
  if (!me || !me.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json();
  const s = await prisma.settings.update({
    where: { id: 1 },
    data: {
      buyGoldPerUsd: body.buyGoldPerUsd ?? undefined,
      withdrawGoldPerUsd: body.withdrawGoldPerUsd ?? undefined,
      adRewardGold: body.adRewardGold ?? undefined,
      dailyAdLimit: body.dailyAdLimit ?? undefined,
    },
  });
  return NextResponse.json(s);
}
