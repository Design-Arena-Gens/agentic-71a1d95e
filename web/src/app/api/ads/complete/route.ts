import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { canRewardAd, dayKey, verifyAdToken } from '@/lib/ads';
import { prisma } from '@/lib/prisma';
import { recordGoldTransaction } from '@/lib/gold';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  const me = await getSession();
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { body, sig, nonce, durationMs } = await req.json();
  if (!body || !sig || !nonce || typeof durationMs !== 'number') return NextResponse.json({ error: 'Invalid' }, { status: 400 });
  if (!verifyAdToken(body, sig)) return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
  const payload = JSON.parse(body);
  if (payload.userId !== me.id || payload.nonce !== nonce) return NextResponse.json({ error: 'Mismatch' }, { status: 400 });
  const now = Date.now();
  if (Math.abs(now - payload.ts) > 1000 * 60 * 10) return NextResponse.json({ error: 'Expired' }, { status: 400 });
  // Basic anti-bot: require minimum 10s ad duration
  if (durationMs < 10_000) return NextResponse.json({ error: 'Too short' }, { status: 400 });

  const { allowed, settings } = await canRewardAd(me.id);
  if (!allowed) return NextResponse.json({ error: 'Daily limit reached' }, { status: 429 });

  const tokenHash = crypto.createHash('sha256').update(body + sig).digest('hex');
  const existing = await prisma.adImpression.findFirst({ where: { tokenHash } });
  if (existing) return NextResponse.json({ error: 'Replay' }, { status: 400 });

  await prisma.adImpression.create({
    data: {
      userId: me.id,
      provider: 'demo',
      nonce,
      tokenHash,
      rewarded: true,
      dayKey: dayKey(),
    },
  });

  await recordGoldTransaction({ userId: me.id, type: 'ad_reward', goldAmount: settings.adRewardGold, usdCents: 0, note: 'Rewarded ad' });

  return NextResponse.json({ ok: true, goldRewarded: settings.adRewardGold });
}
