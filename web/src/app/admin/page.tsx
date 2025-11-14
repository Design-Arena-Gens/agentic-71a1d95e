import { getSession } from '@/lib/auth';
import { getOrCreateSettings } from '@/lib/settings';
import { redirect } from 'next/navigation';
export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const me = await getSession();
  if (!me || !me.isAdmin) redirect('/');
  const settings = await getOrCreateSettings();
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-bold">Admin</h1>
      <form action={saveSettings} className="grid max-w-md gap-3">
        <label className="grid gap-1">
          <span className="text-sm">GOLD por 1 USD (Compra)</span>
          <input name="buyGoldPerUsd" type="number" defaultValue={settings.buyGoldPerUsd} className="border px-2 py-1" />
        </label>
        <label className="grid gap-1">
          <span className="text-sm">GOLD por 1 USD (Saque)</span>
          <input name="withdrawGoldPerUsd" type="number" defaultValue={settings.withdrawGoldPerUsd} className="border px-2 py-1" />
        </label>
        <label className="grid gap-1">
          <span className="text-sm">Recompensa de an?ncio (GOLD)</span>
          <input name="adRewardGold" type="number" defaultValue={settings.adRewardGold} className="border px-2 py-1" />
        </label>
        <label className="grid gap-1">
          <span className="text-sm">Limite de an?ncios/dia</span>
          <input name="dailyAdLimit" type="number" defaultValue={settings.dailyAdLimit} className="border px-2 py-1" />
        </label>
        <button className="mt-2 rounded bg-black px-3 py-2 text-white">Salvar</button>
      </form>
    </main>
  );
}

async function saveSettings(formData: FormData) {
  'use server';
  const body = {
    buyGoldPerUsd: Number(formData.get('buyGoldPerUsd')),
    withdrawGoldPerUsd: Number(formData.get('withdrawGoldPerUsd')),
    adRewardGold: Number(formData.get('adRewardGold')),
    dailyAdLimit: Number(formData.get('dailyAdLimit')),
  };
  await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/settings`, { method: 'POST', body: JSON.stringify(body) });
}
