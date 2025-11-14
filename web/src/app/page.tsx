import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getOrCreateSettings } from '@/lib/settings';
import ClientDashboard from './ui/ClientDashboard';
export const dynamic = 'force-dynamic';

async function ensureSeed() {
  const nftCount = await prisma.nFT.count();
  if (nftCount === 0) {
    await prisma.nFT.createMany({
      data: [
        { name: 'Sword of Dawn', rarity: 'COMMON', farmGoldPerHour: 1, priceGold: 20 },
        { name: 'Shield of Aegis', rarity: 'RARE', farmGoldPerHour: 3, priceGold: 60 },
        { name: 'Dragon Helm', rarity: 'EPIC', farmGoldPerHour: 7, priceGold: 140 },
        { name: 'Phoenix Wings', rarity: 'LEGENDARY', farmGoldPerHour: 15, priceGold: 300 },
      ],
    });
  }
  const itemCount = await prisma.shopItem.count();
  if (itemCount === 0) {
    await prisma.shopItem.createMany({
      data: [
        { name: 'Energy +10', type: 'energy', priceGold: 5 },
        { name: '2x Farm Boost (1h)', type: 'boost', priceGold: 25 },
        { name: 'Starter Cosmetic', type: 'cosmetic', priceGold: 10 },
        { name: 'Mystery Box', type: 'box', priceGold: 50 },
      ],
    });
  }
}

export default async function Home() {
  await ensureSeed();
  const me = await getSession();
  const settings = await getOrCreateSettings();
  let profile: any = null;
  if (me) {
    const user = await prisma.user.findUnique({ where: { id: me.id } });
    const nfts = await prisma.userNFT.count({ where: { userId: me.id } });
    profile = { username: user?.username, gold: user?.goldBalance ?? 0, nfts };
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold">P2E NFT Game</h1>
      <ClientDashboard me={me} profile={profile} settings={settings} />
    </main>
  );
}
