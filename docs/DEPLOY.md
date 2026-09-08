# Deploy agent Am-M di VPS

Lokal (`bag dev`) sudah cukup untuk dogfood. Juri, TermiX, dan 8004scan **butuh HTTPS publik**. Urutannya: **VPS dulu, baru** `bag erc8004 register`. Jangan daftar dulu dengan `localhost`.

Delapan seller = delapan proses Node + **satu** indexer (pm2), di belakang nginx. Bukan `bag deploy` / AgentCore.

Cara jalan lokal: `[RUNNING.md](./RUNNING.md)`.

---

## Variabel cepat (copy-paste)

Pakai di Mac **dan** VPS supaya perintah tidak ketukar:

```bash
# Conservative — sudah ada wallet + 8004
CONS="healthfactor rebalancing gridtrading yieldrouter"

# Aggressive — workspace terpisah (agents/*agg)
AGG="healthfactoragg rebalancingagg gridtradingagg yieldrouteragg"

# Deploy / scp / build
ALL="$CONS $AGG"

# Mac → VPS (sesuaikan)
HOST=user@IP_VPS
DEST=/opt/am-m
```

---

## Tabel 8 agent

| pm2 name | Variant | Desk (`AMM_DESK`) | Port | URL publik | Wallet (catalog) |
| -------- | ------- | ----------------- | ---- | ---------- | ---------------- |
| `healthfactor` | conservative | guard | 9001 | `https://healthfactor.ammlabs.fun/` | `0xDF977e03657B96C43663c28430274031266072b4` |
| `rebalancing` | conservative | rebalance | 9002 | `https://rebalancing.ammlabs.fun/` | `0x7f3FA089a0D2F0c48d7EcacF843a03D69793C878` |
| `gridtrading` | conservative | grid | 9003 | `https://gridtrading.ammlabs.fun/` | `0xB4E7De3592E237ceE295499f2D3d876A378698C6` |
| `yieldrouter` | conservative | yield | 9004 | `https://yieldrouter.ammlabs.fun/` | `0x670F9ECAfd03215cE3094097d8172bC3B212Fc6c` |
| `healthfactoragg` | aggressive | guard | 9005 | `https://healthfactoragg.ammlabs.fun/` | *(isi setelah `bag wallet new`)* |
| `rebalancingagg` | aggressive | rebalance | 9006 | `https://rebalancingagg.ammlabs.fun/` | *(isi setelah `bag wallet new`)* |
| `gridtradingagg` | aggressive | grid | 9007 | `https://gridtradingagg.ammlabs.fun/` | *(isi setelah `bag wallet new`)* |
| `yieldrouteragg` | aggressive | yield | 9008 | `https://yieldrouteragg.ammlabs.fun/` | *(isi setelah `bag wallet new`)* |

Aggressive = folder `agents/<nama>agg`, source symlink ke conservative, `studio.toml` + wallet sendiri. Scaffold: `./scripts/scaffold-aggressive-agents.sh`.

Hire aggressive menulis `agentId` (mis. `yieldrouteragg`) ke indexer — conservative **tidak** ambil session itu (`AMM_AGENT_ID` di `ecosystem.config.cjs`).

---

## 1. Yang tidak ikut ke VPS

| Ada di Mac | Di VPS |
| ---------- | ------ |
| Keystore admin `.studio/wallets/0x….json` | **Jangan disalin** |
| `WALLET_PASSWORD` | **Jangan** |
| `bag wallet new` | **Hanya di Mac** — jangan diulang (keystore baru = identitas baru) |
| `.env.local` Mac | **Jangan scp** (ada password) |

Yang **wajib** di VPS:

- Kode repo + `packages/agent-strategy` built
- `agents/<nama>/.studio/wallets/altana-session.json` — session **agent** saja (`chmod 600`)
- `agents/<nama>/.studio/.env.local` — runtime tanpa `WALLET_PASSWORD`
- Indexer + Postgres (§7)

**Session agent** (`altana-session.json`) ≠ **session user** (hire FE → indexer). User session tidak di-scp dari Mac.

Kalau VPS bocor: penyerang dapat session berbatas (cap + expiry), bukan admin key. Cabut dari Mac: `bag wallet session revoke`.

---

## 2. Prasyarat server

- Ubuntu 24.04 (atau setara), **Node.js ≥ 22**, `pnpm`, `git`, **pm2** (`npm i -g pm2`)
- **Docker Engine + Compose** (Postgres indexer). Cek: `docker compose version`

```bash
sudo apt install -y docker.io docker-compose-v2
sudo usermod -aG docker "$USER"
# logout/login SSH sekali, lalu: docker ps
```

- `bag --version` **0.0.13** di **Mac** (wallet + register 8004)
- Domain **ammlabs.fun** — **8 subdomain** (atau wildcard `*.ammlabs.fun A <IP_VPS>`)

```
healthfactor.ammlabs.fun     A  <IP_VPS>
rebalancing.ammlabs.fun      A  <IP_VPS>
gridtrading.ammlabs.fun      A  <IP_VPS>
yieldrouter.ammlabs.fun      A  <IP_VPS>
healthfactoragg.ammlabs.fun  A  <IP_VPS>
rebalancingagg.ammlabs.fun   A  <IP_VPS>
gridtradingagg.ammlabs.fun   A  <IP_VPS>
yieldrouteragg.ammlabs.fun   A  <IP_VPS>
```

Firewall: **80/443** ke dunia. Port **9001–9008**, 9000, 8088, **42069**, **5432** **hanya loopback**.

**9router** harus reachable dari VPS (bukan `127.0.0.1` di Mac).

---

## 3. Kode di VPS (build)

```bash
sudo mkdir -p /opt/am-m && sudo chown "$USER":"$USER" /opt/am-m
git clone <repo> /opt/am-m
cd /opt/am-m

cd packages/agent-strategy && pnpm install && pnpm build && cd ../..

# Conservative (4)
for a in healthfactor rebalancing gridtrading yieldrouter; do
  (cd "agents/$a" && pnpm install)
  (cd "agents/$a/app/agent" && pnpm install && pnpm build)
done

# Aggressive (4) — WAJIB scaffold dulu (symlink relatif ke conservative)
./scripts/scaffold-aggressive-agents.sh
ls -la agents/healthfactoragg/app/agent/package.json
# harus -> ../../../healthfactor/app/agent/package.json (bukan path /Users/...)

for a in healthfactoragg rebalancingagg gridtradingagg yieldrouteragg; do
  (cd "agents/$a/app/agent" && pnpm install && pnpm build)
done
```

Jangan `pnpm install` hanya di akar Turbo — `agents/` di luar workspace root.

**`ERR_PNPM_NO_IMPORTER_MANIFEST_FOUND` di `*agg`?** Folder `app/agent` kosong / symlink Mac absolute rusak. Fix:

```bash
cd /opt/am-m   # atau ~/Am-M
git pull
chmod +x scripts/scaffold-aggressive-agents.sh
./scripts/scaffold-aggressive-agents.sh
readlink agents/healthfactoragg/app/agent/package.json
for a in healthfactoragg rebalancingagg gridtradingagg yieldrouteragg; do
  (cd "agents/$a/app/agent" && pnpm install && pnpm build)
done
```

---

## 4. Mac — wallet & session agent

Semua langkah **§4 di Mac**, folder repo `Am-M/`.

### 4A. Conservative (4) — sudah punya wallet

**Grant / perpanjang session** (disarankan 90 hari):

```bash
GRANT="bag wallet session grant --budget-u 5 --expiry-days 90 --yes"
# kalau sudah ada session: tambahkan --force

for a in healthfactor rebalancing gridtrading yieldrouter; do
  echo "=== $a ==="
  (cd "agents/$a/app/agent" && bag wallet session status)
  (cd "agents/$a/app/agent" && $GRANT)
done
```

**Kirim session ke VPS** (menimpa file lama):

```bash
HOST=user@IP_VPS
DEST=/opt/am-m

ssh "$HOST" "mkdir -p $DEST/agents/{healthfactor,rebalancing,gridtrading,yieldrouter}/.studio/wallets"

for a in healthfactor rebalancing gridtrading yieldrouter; do
  scp "agents/$a/.studio/wallets/altana-session.json" \
    "$HOST:$DEST/agents/$a/.studio/wallets/altana-session.json"
done

ssh "$HOST" "chmod 600 $DEST/agents/{healthfactor,rebalancing,gridtrading,yieldrouter}/.studio/wallets/altana-session.json"
```

**Di VPS — restart saja** (tidak perlu `pm2 delete`):

```bash
pm2 restart healthfactor rebalancing gridtrading yieldrouter
pm2 save
```

> Ganti `altana-session.json` → **`pm2 restart`** cukup.  
> Ganti `.env.local` atau `ecosystem.config.cjs` → **`pm2 delete all && pm2 start ecosystem.config.cjs`**.

---

### 4B. Aggressive (4) — wallet baru

```bash
./scripts/scaffold-aggressive-agents.sh

GRANT="bag wallet session grant --budget-u 5 --expiry-days 90 --yes"

for a in healthfactoragg rebalancingagg gridtradingagg yieldrouteragg; do
  echo "=== $a ==="
  cp "agents/$a/.env.example" "agents/$a/.studio/.env.local"
  chmod 600 "agents/$a/.studio/.env.local"
  # isi WALLET_PASSWORD di .studio/.env.local (Mac only)

  (cd "agents/$a" && bag wallet new)
  (cd "agents/$a/app/agent" && $GRANT)
  (cd "agents/$a/app/agent" && bag wallet session status)
done
```

Update `apps/web/lib/catalog.ts` — `wallet` + `registryId` tiap `*agg` dari `bag erc8004 show` (§9B).

**Kirim session aggressive ke VPS:**

```bash
ssh "$HOST" "mkdir -p $DEST/agents/{healthfactoragg,rebalancingagg,gridtradingagg,yieldrouteragg}/.studio/wallets"

for a in healthfactoragg rebalancingagg gridtradingagg yieldrouteragg; do
  scp "agents/$a/.studio/wallets/altana-session.json" \
    "$HOST:$DEST/agents/$a/.studio/wallets/altana-session.json"
done

ssh "$HOST" "chmod 600 $DEST/agents/{healthfactoragg,rebalancingagg,gridtradingagg,yieldrouteragg}/.studio/wallets/altana-session.json"
```

**Di VPS:**

```bash
pm2 restart healthfactoragg rebalancingagg gridtradingagg yieldrouteragg
# atau kalau belum pernah start:
pm2 start ecosystem.config.cjs --only healthfactoragg,rebalancingagg,gridtradingagg,yieldrouteragg
pm2 save
```

---

### 4C. Cek copy session (VPS)

```bash
ls -l /opt/am-m/agents/*/.studio/wallets/
```

Yang **boleh**: `altana-session.json` mode `-rw-------`.

Yang **tidak boleh**: `0x….json` (keystore admin), `user-admin.json`.

---

## 5. Env runtime di VPS

Satu file per agent: `agents/<nama>/.studio/.env.local` (`chmod 600`). Tulis **baru** di server; jangan scp dari Mac.

`ecosystem.config.cjs` sudah set: `AGENT_PORT`, `AMM_DESK`, `AMM_AGENT_ID`, `AGENT_VARIANT`, `PUBLIC_AGENT_URL`, `INDEXER_URL=http://127.0.0.1:42069`.

### 5A. Conservative — contoh `healthfactor`

```
NINEROUTER_API_KEY=
NINEROUTER_BASE_URL=https://<9router-reachable>/v1
OPENAI_API_KEY=

INDEXER_SECRET=<sama indexer>
SESSION_KEY_ENCRYPTION_KEY=<sama indexer>

BNB_TESTNET_RPC_URL=https://bsc-testnet-rpc.publicnode.com
TICK_INTERVAL_MS=120000
```

Ulangi file untuk `rebalancing`, `gridtrading`, `yieldrouter` (secret sama; port/URL dari ecosystem).

### 5B. Aggressive — contoh `healthfactoragg`

Sama pola §5A. `AGENT_VARIANT=aggressive` sudah di ecosystem — tidak perlu ditulis ulang kecuali override.

### 5C. Semua 8 agent — sync secret indexer

```bash
for a in healthfactor rebalancing gridtrading yieldrouter \
         healthfactoragg rebalancingagg gridtradingagg yieldrouteragg; do
  nano "/opt/am-m/agents/$a/.studio/.env.local"
done
```

Isi minimal (identik di kedelapan):

```
INDEXER_SECRET=<sama indexer>
SESSION_KEY_ENCRYPTION_KEY=<sama indexer>
```

Setelah edit `.env.local` → `pm2 delete all && pm2 start ecosystem.config.cjs && pm2 save` (bukan cuma restart).

---

## 6. Reverse proxy (nginx)

Satu file site per subdomain. **Indexer** (`/indexer/`) **hanya** di `healthfactor.ammlabs.fun` (port 42069).

### 6A. Conservative (4)

| File | `proxy_pass` |
| ---- | ------------ |
| `healthfactor.ammlabs.fun` | `9001` (+ `location /indexer/` → `42069`) |
| `rebalancing.ammlabs.fun` | `9002` |
| `gridtrading.ammlabs.fun` | `9003` |
| `yieldrouter.ammlabs.fun` | `9004` |

Contoh blok agent (`healthfactor`, port 9001):

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name healthfactor.ammlabs.fun;

    location /indexer/ {
        client_max_body_size 256k;
        proxy_pass http://127.0.0.1:42069/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
    }

    location / {
        proxy_pass http://127.0.0.1:9001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
    }
}
```

Tiga conservative lain: sama, **tanpa** `/indexer/`, ganti `server_name` + port 9002/9003/9004.

```bash
for s in healthfactor rebalancing gridtrading yieldrouter; do
  sudo ln -sf "/etc/nginx/sites-available/${s}.ammlabs.fun" /etc/nginx/sites-enabled/
done
```

### 6B. Aggressive (4)

| File | `proxy_pass` |
| ---- | ------------ |
| `healthfactoragg.ammlabs.fun` | `9005` |
| `rebalancingagg.ammlabs.fun` | `9006` |
| `gridtradingagg.ammlabs.fun` | `9007` |
| `yieldrouteragg.ammlabs.fun` | `9008` |

Pola `location /` saja (tanpa indexer). Enable:

```bash
for s in healthfactoragg rebalancingagg gridtradingagg yieldrouteragg; do
  sudo ln -sf "/etc/nginx/sites-available/${s}.ammlabs.fun" /etc/nginx/sites-enabled/
done
sudo nginx -t && sudo systemctl reload nginx
```

### 6C. SSL — delapan domain sekaligus

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx \
  -d healthfactor.ammlabs.fun \
  -d rebalancing.ammlabs.fun \
  -d gridtrading.ammlabs.fun \
  -d yieldrouter.ammlabs.fun \
  -d healthfactoragg.ammlabs.fun \
  -d rebalancingagg.ammlabs.fun \
  -d gridtradingagg.ammlabs.fun \
  -d yieldrouteragg.ammlabs.fun
```

Setelah certbot: pastikan `location /indexer/` ada di blok **`listen 443 ssl`** healthfactor (bukan cuma redirect 80).

### 6D. Warning port 9000 / 8088

Scaffold coba bind 9000 dan 8088 (kontrak AgentCore). Hanya agent pertama yang dapat; sisanya log `EADDRINUSE` — **wajar**. Nginx pakai 9001–9008 saja.

---

## 7. pm2 (9 proses)

`ecosystem.config.cjs` di akar repo: **8 agent + indexer**.

### Start / rebuild penuh

```bash
cd /opt/am-m
(cd packages/agent-strategy && pnpm install && pnpm build)
CI=true pnpm install --filter indexer

for a in healthfactor rebalancing gridtrading yieldrouter; do
  (cd "agents/$a" && pnpm install)
  (cd "agents/$a/app/agent" && pnpm install && pnpm build)
done
for a in healthfactoragg rebalancingagg gridtradingagg yieldrouteragg; do
  (cd "agents/$a/app/agent" && pnpm install && pnpm build)
done

pm2 delete all
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup   # jalankan perintah sudo yang dicetak
```

Harus **9** app `online`: 8 agent + `indexer`.

### Kapan restart vs delete

| Perubahan | Perintah |
| --------- | -------- |
| Ganti `altana-session.json` saja | `pm2 restart <nama>` |
| Ganti `.env.local` agent | `pm2 delete all && pm2 start ecosystem.config.cjs` |
| Ganti `ecosystem.config.cjs` | `pm2 delete all && pm2 start ecosystem.config.cjs` |
| Indexer `.env.local` | `pm2 stop indexer && pm2 delete indexer && pm2 start ecosystem.config.cjs --only indexer` |

**Jangan** `pm2 restart all --update-env` setelah edit `.env.local` — tidak re-read file.

### Restart per kelompok

```bash
# Conservative saja
pm2 restart healthfactor rebalancing gridtrading yieldrouter

# Aggressive saja
pm2 restart healthfactoragg rebalancingagg gridtradingagg yieldrouteragg

# Indexer saja (env berubah → delete+start --only indexer)
```

### Cek

```bash
pm2 status
pm2 logs healthfactor --lines 20 --nostream | grep seller-agent
# log boot: public=https://healthfactor.ammlabs.fun
pm2 env 0 | grep -E 'PUBLIC_AGENT|AMM_AGENT_ID|AGENT_VARIANT|INDEXER_URL'
```

---

## 7.1 Indexer (Postgres + hire FE)

Hire dari FE → `POST /indexer/v1/sessions` → Postgres → agent tick fetch loopback `:42069`.

URL publik indexer: **`https://healthfactor.ammlabs.fun/indexer/`** (satu tempat).

#### A. Postgres

```bash
cd /opt/am-m
docker compose up -d postgres
docker compose exec postgres pg_isready -U amm -d amm
```

#### B. Dua secret (generate sekali)

```bash
openssl rand -hex 32   # INDEXER_SECRET
openssl rand -hex 32   # SESSION_KEY_ENCRYPTION_KEY
```

| File | `INDEXER_SECRET` | `SESSION_KEY_ENCRYPTION_KEY` |
| ---- | ---------------- | ---------------------------- |
| `apps/indexer/.env.local` | ya | ya |
| **8×** `agents/<nama>/.studio/.env.local` | ya | ya |
| Mac `apps/web/.env.local` | ya | **tidak** |

#### C. Env indexer

```
DATABASE_URL=postgres://amm:amm@127.0.0.1:5432/amm
DATABASE_SCHEMA=ponder
INDEXER_SECRET=...
SESSION_KEY_ENCRYPTION_KEY=...
BNB_TESTNET_RPC_URL=https://bsc-testnet-rpc.publicnode.com
BNB_MAINNET_RPC_URL=https://bsc-rpc.publicnode.com
```

```bash
cd /opt/am-m && CI=true pnpm install --filter indexer
```

#### D. Cek indexer

```bash
curl -sS http://127.0.0.1:42069/v1/health
curl -sS https://healthfactor.ammlabs.fun/indexer/v1/health
```

#### E. FE (Mac / Vercel)

```
INDEXER_URL=https://healthfactor.ammlabs.fun/indexer
INDEXER_SECRET=<sama indexer>
```

Restart Next setelah edit.

#### F. Setelah `git pull`

```bash
cd /opt/am-m && git pull
(cd packages/agent-strategy && pnpm install && pnpm build)
CI=true pnpm install --filter indexer
for a in healthfactor rebalancing gridtrading yieldrouter \
         healthfactoragg rebalancingagg gridtradingagg yieldrouteragg; do
  (cd "agents/$a/app/agent" && pnpm install && pnpm build)
done
pm2 delete all && pm2 start ecosystem.config.cjs && pm2 save
```

#### G. Troubleshooting hire / indexer

| Gejala | Cek |
| ------ | --- |
| `indexer sessions 401` | `INDEXER_SECRET` agent ≠ indexer |
| `Unsupported state or unable to authenticate data` | rotate encryption key → hire ulang |
| `ECONNREFUSED 42069` | indexer belum listen; `pm2 logs indexer` |
| hire 502 / `Cannot POST /indexer/` | nginx `location /indexer/` di **443** healthfactor |
| agent idle setelah hire | `AMM_DESK`, `AMM_AGENT_ID`, encryption key |
| job page **0 strategy txs** padahal agent jalan | indexer lama / cursor lewat block tx → **§7.1 backfill** |
| RPC `History has been pruned` | ganti RPC archive atau naikkan start block |

**Backfill execution log** (setelah upgrade indexer scanner): reset cursor scan per session supaya tx lama di-index ulang dari block grant:

```bash
psql "$DATABASE_URL" -c "DELETE FROM amm.session_scan WHERE session_id = 's-XXXXXXXX';"
# atau semua session aktif:
psql "$DATABASE_URL" -c "DELETE FROM amm.session_scan;"
pm2 restart indexer
```

Tx **grant** (`grantTx`) sengaja tidak masuk strategy tx count.

---

## 8. Cek HTTPS (8 agent)

```bash
for a in healthfactor rebalancing gridtrading yieldrouter \
         healthfactoragg rebalancingagg gridtradingagg yieldrouteragg; do
  echo "=== $a ==="
  curl -sS "https://${a}.ammlabs.fun/.well-known/agent-card.json" | head -c 120
  echo
  curl -sS "https://${a}.ammlabs.fun/strategy" | head -c 120
  echo
done
```

Card: `url` HTTPS, skills `negotiate` + `notify_funded`. `/strategy` idle tanpa hire = wajar.

---

## 9. Listing ERC-8004 (Mac, setelah HTTPS hidup)

### 9A. Conservative (4)

```bash
for a in healthfactor rebalancing gridtrading yieldrouter; do
  echo "=== $a ==="
  (cd "agents/$a" && bag erc8004 register --endpoint "https://${a}.ammlabs.fun/")
  (cd "agents/$a" && bag erc8004 show)
done
```

### 9B. Aggressive (4)

```bash
for a in healthfactoragg rebalancingagg gridtradingagg yieldrouteragg; do
  echo "=== $a ==="
  (cd "agents/$a" && bag erc8004 register --endpoint "https://${a}.ammlabs.fun/")
  (cd "agents/$a" && bag erc8004 show)
done
```

Update `apps/web/lib/catalog.ts`: `wallet`, `registryId`, `endpoint`, `strategyUrl` untuk keempat `*agg`.

---

## 10. Hire publik vs settle

A2A `negotiate` → `hireErc8183Agent` → agent kerja lewat session **user** di indexer.

`bag erc8183 settle <id> --action approve` — lepas escrow $U setelah jendela sengketa (~24 jam).

Storage `kind = local` di VPS boleh.

---

## 11. Checklist urutan deploy

1. VPS: clone, build strategy + 8 agent, Postgres, indexer env
2. Mac: session grant conservative (+ aggressive kalau belum)
3. scp `altana-session.json` → VPS → `pm2 restart` (per kelompok 4)
4. nginx 8 site + certbot
5. Mac: `erc8004 register` × 8, update `catalog.ts` aggressive
6. Sync `INDEXER_SECRET` ke 8 agent + FE → `pm2 delete all && pm2 start` kalau env baru
7. Hire dari FE → cek `/strategy` + log tick

Belum di dokumen ini: FE Vercel production, laporan TermiX.
