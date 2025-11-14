import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { setSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  if (!username || !password) return NextResponse.json({ error: 'Missing' }, { status: 400 });
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 400 });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return NextResponse.json({ error: 'Invalid credentials' }, { status: 400 });
  await setSession({ id: user.id, username: user.username, isAdmin: user.isAdmin });
  return NextResponse.json({ ok: true });
}
