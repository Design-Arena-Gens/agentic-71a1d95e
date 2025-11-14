import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getOrCreateSettings } from '@/lib/settings';
import { recordGoldTransaction, usdToGoldBuy } from '@/lib/gold';

export async function POST(req: NextRequest) {
  const me = await getSession();
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { usd } = await req.json();
  const usdCents = Math.floor(Number(usd) * 100);
  if (!usdCents || usdCents <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
  const s = await getOrCreateSettings();
  const gold = usdToGoldBuy(usdCents, s);
  await recordGoldTransaction({ userId: me.id, type: 'deposit', goldAmount: gold, usdCents, note: 'GOLD purchase' });
  return NextResponse.json({ ok: true, goldCredited: gold });
}
