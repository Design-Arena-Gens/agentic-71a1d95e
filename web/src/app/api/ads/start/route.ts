import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { canRewardAd, signAdToken } from '@/lib/ads';
import { randomUUID } from 'crypto';

export async function POST() {
  const me = await getSession();
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { allowed, remaining, settings } = await canRewardAd(me.id);
  if (!allowed) return NextResponse.json({ error: 'Daily limit reached' }, { status: 429 });
  const nonce = randomUUID();
  const ts = Date.now();
  const payload = { userId: me.id, nonce, ts, provider: 'demo' };
  const token = signAdToken(payload);
  return NextResponse.json({ nonce, token, rewardGold: settings.adRewardGold, remaining });
}
