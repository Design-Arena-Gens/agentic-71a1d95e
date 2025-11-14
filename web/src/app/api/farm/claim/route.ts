import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { recordGoldTransaction } from '@/lib/gold';

export async function POST() {
  const me = await getSession();
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userFarm = await prisma.userFarm.upsert({ where: { userId: me.id }, create: { userId: me.id }, update: {} });
  const now = new Date();
  const elapsedMs = now.getTime() - new Date(userFarm.lastClaimAt).getTime();
  const hours = elapsedMs / 3_600_000;
  const userNfts = await prisma.userNFT.findMany({ where: { userId: me.id }, include: { nft: true } });
  const ratePerHour = userNfts.map((u: any) => u.nft.farmGoldPerHour).reduce((a: number, b: number) => a + b, 0);
  const accrued = Math.floor(ratePerHour * hours);
  if (accrued <= 0) return NextResponse.json({ ok: true, accrued: 0 });

  await prisma.$transaction(async (tx: any) => {
    await tx.userFarm.update({ where: { userId: me.id }, data: { lastClaimAt: now } });
    await recordGoldTransaction({ userId: me.id, type: 'farm_claim', goldAmount: accrued, usdCents: 0, note: 'Farm claim' });
  });

  return NextResponse.json({ ok: true, accrued });
}
