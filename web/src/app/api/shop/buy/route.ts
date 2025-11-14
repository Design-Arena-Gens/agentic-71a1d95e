import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { recordGoldTransaction } from '@/lib/gold';

export async function POST(req: NextRequest) {
  const me = await getSession();
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { itemId } = await req.json();
  const item = await prisma.shopItem.findUnique({ where: { id: itemId } });
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const user = await prisma.user.findUnique({ where: { id: me.id } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  if (user.goldBalance < item.priceGold) return NextResponse.json({ error: 'Insufficient GOLD' }, { status: 400 });

  await prisma.$transaction(async (tx: any) => {
    await recordGoldTransaction({ userId: me.id, type: item.type === 'cosmetic' ? 'spend_cosmetic' : item.type === 'boost' ? 'spend_boost' : item.type === 'box' ? 'spend_box' : 'spend_energy', goldAmount: item.priceGold, usdCents: 0, note: `Buy ${item.name}` });
    await tx.purchase.create({ data: { userId: me.id, itemId: item.id } });
  });

  return NextResponse.json({ ok: true });
}
