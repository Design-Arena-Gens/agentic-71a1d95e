import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { setSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  if (!username || !password) return NextResponse.json({ error: 'Missing' }, { status: 400 });
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) return NextResponse.json({ error: 'Username taken' }, { status: 400 });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { username, passwordHash } });
  await setSession({ id: user.id, username: user.username, isAdmin: user.isAdmin });
  return NextResponse.json({ ok: true });
}
