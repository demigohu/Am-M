# Cara menjalankan Am-M

Repo ini **dua dunia**. Jangan campur perintahnya.

```
Am-M/                          ← Turbo + Next.js (marketplace FE, belakangan)
  apps/web
  apps/docs
  packages/ui, eslint-config, typescript-config
  packages/agent-strategy      ← kode Venus/PCS bersama; BUKAN proses yang di-run

  agents/                      ← DI LUAR workspace pnpm root (sengaja)
    healthfactor/              ← 1 proses bag + 1 wallet Altana + 1 identitas ERC-8004
    yieldrouter/
    rebalancing/
    gridtrading/
```

Cara jalan lokal: dokumen ini. Deploy VPS + listing ERC-8004: [`DEPLOY.md`](./DEPLOY.md) — **VPS dulu, baru `bag erc8004 register`**.

`pnpm dev` di **akar repo** hanya nyalain Next.js starter. Agent **tidak** ikut.

---

## Kenapa 4 folder agent, 4 wallet?

`bag init` membuat **satu seller = satu proyek = satu signer**.

| Yang tidak boleh dibagi | Alasan |
|---|---|
| Folder `agents/<nama>/` | CLI `bag` mengunci `studio.toml`, `.studio/wallets/`, port, dan `pnpm-workspace.yaml` per proyek. Nama init tidak boleh `-`/`_` (`healthfactor`, bukan `health-factor`). |
| Wallet Altana per agent | Identitas ERC-8004 + penerima $U (ERC-8183) harus alamat sendiri. Session `bag wallet session grant` terikat alamat itu. |
| Proses Node per agent | Loop tick 24/7. Satu proses crash tidak boleh mematikan desk lain. Port: 9001–9004. |

Dana **user** tidak masuk wallet agent. Wallet agent cuma gas + terima $U + daftar 8004. Posisi DeFi hidup di smart account user, lewat session yang di-grant saat hire.

`packages/agent-strategy` ada supaya keempat agent tidak menyalin ABI Venus/PCS empat kali. Itu library, bukan agent.

---

## Kenapa `.env` bukan di `app/agent/`?

`bag` memuat rahasia dari:

```
agents/<nama>/.studio/.env.local
```

Folder `.studio/` **seluruhnya gitignored** (keystore + session + password). Karena itu contoh env **tidak bisa** ditaruh di dalam `.studio/` — tidak akan ter-commit. Contoh yang aman ada di `agents/<nama>/.env.example`; kamu yang copy ke `.studio/.env.local`.

Jangan taruh `WALLET_PASSWORD` atau API key 9router di chat, argv, atau `.env` di `app/agent/` (itu lokasi deploy; keystore dilarang ikut paket).

LLM agent memakai **9router** (OpenAI-compatible), bukan OpenRouter. Di `.studio/.env.local`:

```
NINEROUTER_API_KEY=<key dari dashboard 9router>
NINEROUTER_BASE_URL=<host kamu>/v1
OPENAI_API_KEY=<key yang sama>    # bag doctor membaca nama ini
```

Lokal: `NINEROUTER_BASE_URL=http://127.0.0.1:20128/v1`. Model default `kr/claude-sonnet-4.5` — ganti di `app/agent/studio.toml` `[llm].model` kalau kamu pakai combo sendiri.

---

## First run — satu agent dulu (`healthfactor`)

`bag --version` harus **0.0.13** (SDK 0.5.5). CLI 0.0.12 grant session format lama (5 call tanpa `signature`); runtime 0.0.13 menolak itu. Upgrade: `npm install -g @bnbagent/studio-cli@0.0.13`. Setelah upgrade, `bag wallet session grant --force` lagi.

Di **terminal kamu** (bukan lewat chat):

```bash
cd agents/healthfactor
mkdir -p .studio
cp .env.example .studio/.env.local
chmod 600 .studio/.env.local
# isi WALLET_PASSWORD, NINEROUTER_API_KEY, NINEROUTER_BASE_URL
# (OPENAI_API_KEY = key 9router yang sama, supaya bag doctor hijau)
```

Lalu:

```bash
cd agents/healthfactor
pnpm install

cd app/agent
bag wallet new
# cetak alamat admin → danai ≥ 0.02 tBNB + ≥ 1 $U
# faucet tBNB: https://www.bnbchain.org/en/testnet-faucet
# faucet $U:   https://united-coin-u.github.io/u-faucet/

bag wallet session grant --budget-u 10 --expiry-days 30 --yes
cd ../..
bag doctor
bag dev
```

Cek hidup — **port proses itu**, bukan 9000 kecuali Guard dijalankan tanpa `--port`:

```bash
curl -s http://localhost:9001/.well-known/agent-card.json   # healthfactor kalau --port 9001
curl -s http://localhost:9000/.well-known/agent-card.json   # healthfactor default `bag dev`
curl -s http://localhost:9002/strategy                       # rebalancing
curl -s http://localhost:9003/strategy                       # gridtrading
```

Kalau empat agent hidup, `:9000` hampir selalu **Guard** (secondary bind yang menang duluan). Grid = `:9003`.

Tanpa `USER_SESSION_FILE`, tick strategi **idle** (tidak ada tx Venus). Itu wajar: session `bag wallet session grant` adalah session **agent** (quote 8183), bukan izin atas dana user.

Tanpa FE, user uji tetap **Altana** (bukan MetaMask). Passkey diganti EOA admin di script:

```bash
cd agents/healthfactor/app/agent
pnpm grant-user-session
# cetak alamat → danai ≥ 0.02 tBNB (+ USDT Venus testnet supaya mint jalan)
# jalankan lagi setelah dana masuk
# tambah USER_SESSION_FILE=... ke .studio/.env.local, restart bag dev
```

File session: `.studio/user-session.json` (mode 0600, gitignored). Jangan paste isinya di chat.

Rebalancing (PCS LP), dari `agents/rebalancing/app/agent` — reuse wallet user uji Guard, **session baru** (allowlist NFPM):

```bash
cd agents/rebalancing/app/agent
pnpm grant-user-session
# tambah USER_SESSION_FILE=... ke agents/rebalancing/.studio/.env.local
# restart: bag dev --port 9002
```

Butuh USDT + WBNB di wallet user. Script wrap 0.02 tBNB → WBNB kalau WBNB masih 0.

Grid (PCS swap), dari `agents/gridtrading/app/agent` — wallet user uji yang sama, **session baru** (allowlist SwapRouter, bukan NFPM):

```bash
cd agents/gridtrading/app/agent
pnpm grant-user-session
# tambah USER_SESSION_FILE=... dan ERC8183_AGENT_URL=http://127.0.0.1:9003/erc8183
# ke agents/gridtrading/.studio/.env.local
# restart: bag dev --port 9003
curl -s http://localhost:9003/strategy
```

Tick pertama biasanya `noop` (grid armed). Swap hanya jika tick pool geser melewati ambang varian. Jangan copy `USER_SESSION_FILE` Rebalance ke Grid.

Yield (Venus mint matching underlying), dari `agents/yieldrouter/app/agent` — wallet user uji yang sama, **session baru** (mint/redeem, tanpa repay):

```bash
cd agents/yieldrouter/app/agent
pnpm grant-user-session
# tambah USER_SESSION_FILE=... dan ERC8183_AGENT_URL=http://127.0.0.1:9004/erc8183
# ke agents/yieldrouter/.studio/.env.local
# restart: bag dev --port 9004
curl -s http://localhost:9004/strategy
```

Tick parkir USDT/USDC/BNB idle ke vToken yang matching. Jangan copy session Grid/Rebalance. Hire 8183 segera setelah tick (deadline 30 menit).

---

## Empat agent sekaligus (nanti)

Tiap terminal, dari folder agent-nya:

| Agent | `AGENT_PORT` |
|---|---|
| healthfactor | 9001 |
| rebalancing | 9002 |
| gridtrading | 9003 |
| yieldrouter | 9004 |

`bag dev` mengunci port **sebelum** subprocess: `AGENT_PORT=9002 bag dev` **tidak** cukup — CLI tetap probe 9000. Pakai `--port`:

```bash
cd agents/healthfactor && bag dev --port 9001
cd agents/rebalancing  && bag dev --port 9002
cd agents/gridtrading  && bag dev --port 9003
cd agents/yieldrouter  && bag dev --port 9004
```

`--port` mengisi `AGENT_PORT` untuk entrypoint. Scaffold tetap mencoba bind 9000 dan 8088 juga. Agent kedua–keempat akan warning `secondary contract port unavailable` — **boleh diabaikan** selama `--port` unik.

Jangan jalankan `bag wallet new` dua kali di proyek yang sama (keystore baru memutus session).

---

## Dua jenis session (jangan tertukar)

1. **Session agent** — `bag wallet session grant` di folder agent. Wajib supaya `bag dev` bisa sign quote 8183. Bukan untuk mint Venus.
2. **Session user** — hasil `grantSession` passkey di browser (nanti, halaman `/account`). File-nya di-export `USER_SESSION_FILE=...` (mode 0600). Inilah yang dipakai tick untuk `repayBorrow` / `mint` / LP / swap.
