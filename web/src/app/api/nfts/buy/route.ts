import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { recordGoldTransaction } from '@/lib/gold';

export async function POST(req: NextRequest) {
  const me = await getSession();
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { nftId } = await req.json();
  const nft = await prisma.nFT.findUnique({ where: { id: nftId } });
  if (!nft) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const user = await prisma.user.findUnique({ where: { id: me.id } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  if (user.goldBalance < nft.priceGold) return NextResponse.json({ error: 'Insufficient GOLD' }, { status: 400 });

  await prisma.$transaction(async (tx: any) => {
    await recordGoldTransaction({ userId: me.id, type: 'spend_nft', goldAmount: nft.priceGold, usdCents: 0, note: `Buy NFT ${nft.name}` });
    await tx.userNFT.create({ data: { userId: me.id, nftId: nft.id } });
    await tx.userFarm.upsert({ where: { userId: me.id }, update: {}, create: { userId: me.id } });
  });

  return NextResponse.json({ ok: true });
}
