"use client";

import { useEffect, useMemo, useState } from 'react';

type Props = {
  me: { id: string; username: string; isAdmin: boolean } | null;
  profile: { username: string; gold: number; nfts: number } | null;
  settings: { buyGoldPerUsd: number; withdrawGoldPerUsd: number; adRewardGold: number; dailyAdLimit: number };
};

export default function ClientDashboard({ me, profile, settings }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [meState, setMeState] = useState(me);
  const [profileState, setProfileState] = useState(profile);
  const [nfts, setNfts] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [buyUsd, setBuyUsd] = useState('5');
  const [withdrawGold, setWithdrawGold] = useState('20');
  const [adStatus, setAdStatus] = useState<string>('');

  async function refresh() {
    location.reload();
  }

  async function register() {
    const res = await fetch('/api/auth/register', { method: 'POST', body: JSON.stringify({ username, password }) });
    if (res.ok) refresh();
  }
  async function login() {
    const res = await fetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
    if (res.ok) refresh();
  }
  async function logout() {
    const res = await fetch('/api/auth/logout', { method: 'POST' });
    if (res.ok) refresh();
  }

  useEffect(() => {
    fetch('/api/nfts/list').then(r => r.json()).then(setNfts);
    fetch('/api/shop/items').then(r => r.json()).then(setItems);
  }, []);

  async function buyGold() {
    const res = await fetch('/api/gold/buy', { method: 'POST', body: JSON.stringify({ usd: Number(buyUsd) }) });
    if (res.ok) refresh();
  }
  async function withdraw() {
    const res = await fetch('/api/gold/withdraw', { method: 'POST', body: JSON.stringify({ gold: Number(withdrawGold) }) });
    if (res.ok) refresh();
  }

  async function buyNft(nftId: string) {
    const res = await fetch('/api/nfts/buy', { method: 'POST', body: JSON.stringify({ nftId }) });
    if (res.ok) refresh();
  }

  async function buyItem(itemId: string) {
    const res = await fetch('/api/shop/buy', { method: 'POST', body: JSON.stringify({ itemId }) });
    if (res.ok) refresh();
  }

  async function claimFarm() {
    const res = await fetch('/api/farm/claim', { method: 'POST' });
    if (res.ok) refresh();
  }

  // Rewarded ad demo flow
  const [nonce, setNonce] = useState<string | null>(null);
  const [token, setToken] = useState<{ body: string; sig: string } | null>(null);
  const [adPlaying, setAdPlaying] = useState(false);
  const adDurationMs = 15000; // 15s

  async function startAd() {
    setAdStatus('');
    const res = await fetch('/api/ads/start', { method: 'POST' });
    if (!res.ok) { setAdStatus('N?o foi poss?vel iniciar o an?ncio'); return; }
    const data = await res.json();
    setNonce(data.nonce);
    setToken(data.token);
    setAdPlaying(true);
  }

  async function completeAd() {
    if (!nonce || !token) return;
    const res = await fetch('/api/ads/complete', { method: 'POST', body: JSON.stringify({ nonce, body: token.body, sig: token.sig, durationMs: adDurationMs }) });
    if (res.ok) {
      setAdStatus(`+${settings.adRewardGold} GOLD recebido!`);
      setAdPlaying(false);
      setNonce(null); setToken(null);
      setTimeout(refresh, 800);
    } else {
      const e = await res.json();
      setAdStatus(e.error || 'Falha ao validar an?ncio');
      setAdPlaying(false);
    }
  }

  return (
    <div className="mt-6 grid gap-8">
      {!meState ? (
        <div className="rounded border p-4">
          <h2 className="mb-2 text-lg font-semibold">Entrar</h2>
          <div className="flex gap-2">
            <input className="border px-2 py-1" placeholder="Usu?rio" value={username} onChange={e=>setUsername(e.target.value)} />
            <input className="border px-2 py-1" placeholder="Senha" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
            <button className="rounded bg-black px-3 py-1 text-white" onClick={login}>Login</button>
            <button className="rounded border px-3 py-1" onClick={register}>Registrar</button>
          </div>
        </div>
      ) : (
        <div className="rounded border p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold">Ol?, {profileState?.username}</div>
              <div className="text-sm text-gray-600">GOLD: <b>{profileState?.gold ?? 0}</b> | NFTs: <b>{profileState?.nfts ?? 0}</b></div>
            </div>
            <div className="flex gap-2">
              <button className="rounded border px-3 py-1" onClick={logout}>Sair</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded border p-4">
          <h3 className="mb-2 font-semibold">Comprar GOLD</h3>
          <div className="text-sm mb-2">Taxa: {settings.buyGoldPerUsd} GOLD = 1 USD</div>
          <div className="flex items-center gap-2">
            <input className="border px-2 py-1 w-28" type="number" value={buyUsd} onChange={e=>setBuyUsd(e.target.value)} />
            <span>USD ? {(Number(buyUsd) * settings.buyGoldPerUsd) || 0} GOLD</span>
            <button className="rounded bg-emerald-600 px-3 py-1 text-white" onClick={buyGold} disabled={!me}>Comprar</button>
          </div>
        </div>
        <div className="rounded border p-4">
          <h3 className="mb-2 font-semibold">Sacar GOLD</h3>
          <div className="text-sm mb-2">Taxa: {settings.withdrawGoldPerUsd} GOLD = 1 USD</div>
          <div className="flex items-center gap-2">
            <input className="border px-2 py-1 w-28" type="number" value={withdrawGold} onChange={e=>setWithdrawGold(e.target.value)} />
            <span>? ${(Number(withdrawGold) / settings.withdrawGoldPerUsd).toFixed(2)} USD</span>
            <button className="rounded bg-amber-600 px-3 py-1 text-white" onClick={withdraw} disabled={!me}>Solicitar</button>
          </div>
        </div>
      </div>

      <div className="rounded border p-4">
        <h3 className="mb-2 font-semibold">An?ncio Recompensado</h3>
        <div className="text-sm mb-2">Assista at? o fim para ganhar {settings.adRewardGold} GOLD. Limite di?rio configur?vel.</div>
        {!adPlaying ? (
          <button className="rounded bg-indigo-600 px-3 py-1 text-white" onClick={startAd} disabled={!me}>Assistir An?ncio</button>
        ) : (
          <AdPlayer durationMs={adDurationMs} onComplete={completeAd} />
        )}
        {adStatus && <div className="mt-2 text-sm">{adStatus}</div>}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded border p-4">
          <h3 className="mb-2 font-semibold">NFTs</h3>
          <div className="grid gap-2">
            {nfts.map((n) => (
              <div key={n.id} className="flex items-center justify-between rounded border p-2">
                <div>
                  <div className="font-medium">{n.name}</div>
                  <div className="text-xs text-gray-600">Raridade: {n.rarity} ? Farm: {n.farmGoldPerHour}/h</div>
                </div>
                <button className="rounded bg-black px-3 py-1 text-white" onClick={() => buyNft(n.id)} disabled={!me}>Comprar {n.priceGold} GOLD</button>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded border p-4">
          <h3 className="mb-2 font-semibold">Farm</h3>
          <div className="text-sm mb-2">Ganhe GOLD passivamente pela quantidade e raridade dos seus NFTs.</div>
          <button className="rounded bg-green-700 px-3 py-1 text-white" onClick={claimFarm} disabled={!me}>Coletar</button>
        </div>
      </div>

      <div className="rounded border p-4">
        <h3 className="mb-2 font-semibold">Loja</h3>
        <div className="grid gap-2 md:grid-cols-2">
          {items.map((it) => (
            <div key={it.id} className="flex items-center justify-between rounded border p-2">
              <div>
                <div className="font-medium">{it.name}</div>
                <div className="text-xs text-gray-600">Tipo: {it.type}</div>
              </div>
              <button className="rounded bg-slate-800 px-3 py-1 text-white" onClick={() => buyItem(it.id)} disabled={!me}>Comprar {it.priceGold} GOLD</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AdPlayer({ durationMs, onComplete }: { durationMs: number; onComplete: () => void }) {
  const [remaining, setRemaining] = useState(durationMs);
  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => {
      const elapsed = Date.now() - start;
      const rem = Math.max(0, durationMs - elapsed);
      setRemaining(rem);
      if (rem <= 0) {
        clearInterval(id);
        onComplete();
      }
    }, 250);
    return () => clearInterval(id);
  }, [durationMs, onComplete]);

  return (
    <div className="flex items-center gap-3">
      <div className="h-2 w-64 overflow-hidden rounded bg-gray-200">
        <div className="h-2 bg-indigo-600" style={{ width: `${((durationMs - remaining) / durationMs) * 100}%` }} />
      </div>
      <span className="text-sm text-gray-700">{Math.ceil(remaining / 1000)}s</span>
    </div>
  );
}
