import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getOrCreateSettings } from '@/lib/settings';
import { goldToUsdCentsWithdraw, recordGoldTransaction } from '@/lib/gold';

export async function POST(req: NextRequest) {
  const me = await getSession();
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { gold } = await req.json();
  const amount = Math.floor(Number(gold));
  if (!amount || amount <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
  const s = await getOrCreateSettings();
  const usdCents = goldToUsdCentsWithdraw(amount, s);
  await recordGoldTransaction({ userId: me.id, type: 'withdrawal', goldAmount: amount, usdCents, note: 'GOLD withdrawal request' });
  return NextResponse.json({ ok: true, usdCents });
}
