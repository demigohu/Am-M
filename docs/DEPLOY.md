# Deploy Am-M agents on VPS

Local (`bag dev`) is enough for dogfooding. Judges, TermiX, and 8004scan **need public HTTPS**. Order: **VPS first, then** `bag erc8004 register`. Do not register with `localhost` first.

Eight sellers = eight Node processes + **one** indexer (pm2), behind nginx. Not `bag deploy` / AgentCore.

Local run: [`RUNNING.md`](./RUNNING.md).

---

## Quick variables (copy-paste)

Use on Mac **and** VPS so commands do not get mixed up:

```bash
# Conservative — wallet + 8004 already exist
CONS="healthfactor rebalancing gridtrading yieldrouter"

# Aggressive — separate workspace (agents/*agg)
AGG="healthfactoragg rebalancingagg gridtradingagg yieldrouteragg"

# Deploy / scp / build
ALL="$CONS $AGG"

# Mac → VPS (adjust)
HOST=user@VPS_IP
DEST=/opt/am-m
```

---

## Table of 8 agents

| pm2 name | Variant | Desk (`AMM_DESK`) | Port | Public URL | Wallet (catalog) |
| -------- | ------- | ----------------- | ---- | ---------- | ---------------- |
| `healthfactor` | conservative | guard | 9001 | `https://healthfactor.ammlabs.fun/` | `0xDF977e03657B96C43663c28430274031266072b4` |
| `rebalancing` | conservative | rebalance | 9002 | `https://rebalancing.ammlabs.fun/` | `0x7f3FA089a0D2F0c48d7EcacF843a03D69793C878` |
| `gridtrading` | conservative | grid | 9003 | `https://gridtrading.ammlabs.fun/` | `0xB4E7De3592E237ceE295499f2D3d876A378698C6` |
| `yieldrouter` | conservative | yield | 9004 | `https://yieldrouter.ammlabs.fun/` | `0x670F9ECAfd03215cE3094097d8172bC3B212Fc6c` |
| `healthfactoragg` | aggressive | guard | 9005 | `https://healthfactoragg.ammlabs.fun/` | *(fill after `bag wallet new`)* |
| `rebalancingagg` | aggressive | rebalance | 9006 | `https://rebalancingagg.ammlabs.fun/` | *(fill after `bag wallet new`)* |
| `gridtradingagg` | aggressive | grid | 9007 | `https://gridtradingagg.ammlabs.fun/` | *(fill after `bag wallet new`)* |
| `yieldrouteragg` | aggressive | yield | 9008 | `https://yieldrouteragg.ammlabs.fun/` | *(fill after `bag wallet new`)* |

Aggressive = folder `agents/<name>agg`, source symlink to conservative, own `studio.toml` + wallet. Scaffold: `./scripts/scaffold-aggressive-agents.sh`.

Aggressive hires write `agentId` (e.g. `yieldrouteragg`) to indexer — conservative agents **do not** pick those sessions (`AMM_AGENT_ID` in `ecosystem.config.cjs`).

Domain pattern: conservative `https://<agent>.ammlabs.fun/`, aggressive `https://<agent>agg.ammlabs.fun/` (append `agg` to the folder name).

---

## 1. What does NOT go to VPS

| On Mac | On VPS |
| ------ | ------ |
| Admin keystore `.studio/wallets/0x….json` | **Do not copy** |
| `WALLET_PASSWORD` | **Do not** |
| `bag wallet new` | **Mac only** — do not repeat (new keystore = new identity) |
| Mac `.env.local` | **Do not scp** (contains password) |

**Required** on VPS:

- Repo code + built `packages/agent-strategy`
- `agents/<name>/.studio/wallets/altana-session.json` — **agent** session only (`chmod 600`)
- `agents/<name>/.studio/.env.local` — runtime without `WALLET_PASSWORD`
- Indexer + Postgres (§7)

**Agent session** (`altana-session.json`) ≠ **user session** (FE hire → indexer Postgres). User sessions are not scp’d from Mac.

If VPS leaks: attacker gets bounded session (cap + expiry), not admin key. Revoke from Mac: `bag wallet session revoke`.

---

## 2. Server prerequisites

- Ubuntu 24.04 (or equivalent), **Node.js ≥ 22**, `pnpm`, `git`, **pm2** (`npm i -g pm2`)
- **Docker Engine + Compose** (indexer Postgres). Check: `docker compose version`

```bash
sudo apt install -y docker.io docker-compose-v2
sudo usermod -aG docker "$USER"
# logout/login SSH once, then: docker ps
```

- `bag --version` **0.0.13** on **Mac** (wallet + 8004 register)
- Domain **ammlabs.fun** — **8 subdomains** (or wildcard `*.ammlabs.fun A <VPS_IP>`)

```
healthfactor.ammlabs.fun     A  <VPS_IP>
rebalancing.ammlabs.fun      A  <VPS_IP>
gridtrading.ammlabs.fun      A  <VPS_IP>
yieldrouter.ammlabs.fun      A  <VPS_IP>
healthfactoragg.ammlabs.fun  A  <VPS_IP>
rebalancingagg.ammlabs.fun   A  <VPS_IP>
gridtradingagg.ammlabs.fun   A  <VPS_IP>
yieldrouteragg.ammlabs.fun   A  <VPS_IP>
```

Firewall: **80/443** public. Ports **9001–9008**, 9000, 8088, **42069**, **5432** **loopback only**.

**9router** must be reachable from VPS (not `127.0.0.1` on Mac).

---

## 3. Code on VPS (build)

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

# Aggressive (4) — scaffold first (relative symlink to conservative)
./scripts/scaffold-aggressive-agents.sh
ls -la agents/healthfactoragg/app/agent/package.json
# must -> ../../../healthfactor/app/agent/package.json (not /Users/... path)

for a in healthfactoragg rebalancingagg gridtradingagg yieldrouteragg; do
  (cd "agents/$a/app/agent" && pnpm install && pnpm build)
done
```

Do not `pnpm install` only at Turbo root — `agents/` is outside workspace root.

**`ERR_PNPM_NO_IMPORTER_MANIFEST_FOUND` on `*agg`?** Empty `app/agent` or broken Mac absolute symlink. Fix:

```bash
cd /opt/am-m
git pull
chmod +x scripts/scaffold-aggressive-agents.sh
./scripts/scaffold-aggressive-agents.sh
readlink agents/healthfactoragg/app/agent/package.json
for a in healthfactoragg rebalancingagg gridtradingagg yieldrouteragg; do
  (cd "agents/$a/app/agent" && pnpm install && pnpm build)
done
```

---

## 4. Mac — wallet & agent session

All **§4 on Mac**, repo folder `Am-M/`.

### 4A. Conservative (4) — wallets exist

**Grant / extend session** (90 days recommended):

```bash
GRANT="bag wallet session grant --budget-u 5 --expiry-days 90 --yes"
# if session exists: add --force

for a in healthfactor rebalancing gridtrading yieldrouter; do
  echo "=== $a ==="
  (cd "agents/$a/app/agent" && bag wallet session status)
  (cd "agents/$a/app/agent" && $GRANT)
done
```

**Send session to VPS** (overwrites old file):

```bash
HOST=user@VPS_IP
DEST=/opt/am-m

ssh "$HOST" "mkdir -p $DEST/agents/{healthfactor,rebalancing,gridtrading,yieldrouter}/.studio/wallets"

for a in healthfactor rebalancing gridtrading yieldrouter; do
  scp "agents/$a/.studio/wallets/altana-session.json" \
    "$HOST:$DEST/agents/$a/.studio/wallets/altana-session.json"
done

ssh "$HOST" "chmod 600 $DEST/agents/{healthfactor,rebalancing,gridtrading,yieldrouter}/.studio/wallets/altana-session.json"
```

**On VPS — restart only** (no `pm2 delete`):

```bash
pm2 restart healthfactor rebalancing gridtrading yieldrouter
pm2 save
```

> Replace `altana-session.json` → **`pm2 restart`** is enough.  
> Change `.env.local` or `ecosystem.config.cjs` → **`pm2 delete all && pm2 start ecosystem.config.cjs`**.

---

### 4B. Aggressive (4) — new wallets

```bash
./scripts/scaffold-aggressive-agents.sh

GRANT="bag wallet session grant --budget-u 5 --expiry-days 90 --yes"

for a in healthfactoragg rebalancingagg gridtradingagg yieldrouteragg; do
  echo "=== $a ==="
  cp "agents/$a/.env.example" "agents/$a/.studio/.env.local"
  chmod 600 "agents/$a/.studio/.env.local"
  # set WALLET_PASSWORD in .studio/.env.local (Mac only)

  (cd "agents/$a" && bag wallet new)
  (cd "agents/$a/app/agent" && $GRANT)
  (cd "agents/$a/app/agent" && bag wallet session status)
done
```

Update `apps/web/lib/catalog.ts` — `wallet` + `registryId` for each `*agg` from `bag erc8004 show` (§9B).

**Send aggressive sessions to VPS:**

```bash
ssh "$HOST" "mkdir -p $DEST/agents/{healthfactoragg,rebalancingagg,gridtradingagg,yieldrouteragg}/.studio/wallets"

for a in healthfactoragg rebalancingagg gridtradingagg yieldrouteragg; do
  scp "agents/$a/.studio/wallets/altana-session.json" \
    "$HOST:$DEST/agents/$a/.studio/wallets/altana-session.json"
done

ssh "$HOST" "chmod 600 $DEST/agents/{healthfactoragg,rebalancingagg,gridtradingagg,yieldrouteragg}/.studio/wallets/altana-session.json"
```

**On VPS:**

```bash
pm2 restart healthfactoragg rebalancingagg gridtradingagg yieldrouteragg
# or if never started:
pm2 start ecosystem.config.cjs --only healthfactoragg,rebalancingagg,gridtradingagg,yieldrouteragg
pm2 save
```

---

### 4C. Verify session copy (VPS)

```bash
ls -l /opt/am-m/agents/*/.studio/wallets/
```

Allowed: `altana-session.json` mode `-rw-------`.

Not allowed: `0x….json` (admin keystore), `user-admin.json`.

---

## 5. Runtime env on VPS

One file per agent: `agents/<name>/.studio/.env.local` (`chmod 600`). Write **fresh** on server; do not scp from Mac.

`ecosystem.config.cjs` already sets: `AGENT_PORT`, `AMM_DESK`, `AMM_AGENT_ID`, `AGENT_VARIANT`, `PUBLIC_AGENT_URL`, `INDEXER_URL=http://127.0.0.1:42069`.

### 5A. Conservative — example `healthfactor`

```
NINEROUTER_API_KEY=
NINEROUTER_BASE_URL=https://<9router-reachable>/v1
OPENAI_API_KEY=

INDEXER_SECRET=<same as indexer>
SESSION_KEY_ENCRYPTION_KEY=<same as indexer>

BNB_TESTNET_RPC_URL=https://bsc-testnet-rpc.publicnode.com
TICK_INTERVAL_MS=120000
```

Repeat for `rebalancing`, `gridtrading`, `yieldrouter` (same secrets; port/URL from ecosystem).

### 5B. Aggressive — example `healthfactoragg`

Same as §5A. `AGENT_VARIANT=aggressive` already in ecosystem — no need to override unless you want to.

### 5C. All 8 agents — sync indexer secrets

```bash
for a in healthfactor rebalancing gridtrading yieldrouter \
         healthfactoragg rebalancingagg gridtradingagg yieldrouteragg; do
  nano "/opt/am-m/agents/$a/.studio/.env.local"
done
```

Minimum (identical on all eight):

```
INDEXER_SECRET=<same as indexer>
SESSION_KEY_ENCRYPTION_KEY=<same as indexer>
```

After editing `.env.local` → `pm2 delete all && pm2 start ecosystem.config.cjs && pm2 save` (not restart only).

---

## 6. Reverse proxy (nginx)

One site file per subdomain. **Indexer** (`/indexer/`) **only** on `healthfactor.ammlabs.fun` (port 42069).

### 6A. Conservative (4)

| File | `proxy_pass` |
| ---- | ------------ |
| `healthfactor.ammlabs.fun` | `9001` (+ `location /indexer/` → `42069`) |
| `rebalancing.ammlabs.fun` | `9002` |
| `gridtrading.ammlabs.fun` | `9003` |
| `yieldrouter.ammlabs.fun` | `9004` |

Example agent block (`healthfactor`, port 9001):

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

Other three conservative: same, **without** `/indexer/`, change `server_name` + port 9002/9003/9004.

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

`location /` only (no indexer). Enable:

```bash
for s in healthfactoragg rebalancingagg gridtradingagg yieldrouteragg; do
  sudo ln -sf "/etc/nginx/sites-available/${s}.ammlabs.fun" /etc/nginx/sites-enabled/
done
sudo nginx -t && sudo systemctl reload nginx
```

### 6C. SSL — all eight domains

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

After certbot: ensure `location /indexer/` exists on **`listen 443 ssl`** block for healthfactor (not redirect-only on 80).

### 6D. Port 9000 / 8088 warnings

Scaffold tries 9000 and 8088 (AgentCore contract). Only first agent wins; others log `EADDRINUSE` — **normal**. nginx uses 9001–9008 only.

---

## 7. pm2 (9 processes)

`ecosystem.config.cjs` at repo root: **8 agents + indexer**.

### Start / full rebuild

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
pm2 startup   # run printed sudo command
```

Must show **9** apps `online`: 8 agents + `indexer`.

### When restart vs delete

| Change | Command |
| ------ | ------- |
| Replace `altana-session.json` only | `pm2 restart <name>` |
| Change agent `.env.local` | `pm2 delete all && pm2 start ecosystem.config.cjs` |
| Change `ecosystem.config.cjs` | `pm2 delete all && pm2 start ecosystem.config.cjs` |
| Indexer `.env.local` | `pm2 stop indexer && pm2 delete indexer && pm2 start ecosystem.config.cjs --only indexer` |

**Do not** `pm2 restart all --update-env` after editing `.env.local` — env files are not re-read.

### Restart by group

```bash
# Conservative only
pm2 restart healthfactor rebalancing gridtrading yieldrouter

# Aggressive only
pm2 restart healthfactoragg rebalancingagg gridtradingagg yieldrouteragg

# Indexer only (env changed → delete+start --only indexer)
```

### Check

```bash
pm2 status
pm2 logs healthfactor --lines 20 --nostream | grep seller-agent
# boot log: public=https://healthfactor.ammlabs.fun
pm2 env 0 | grep -E 'PUBLIC_AGENT|AMM_AGENT_ID|AGENT_VARIANT|INDEXER_URL'
```

---

## 7.1 Indexer (Postgres + FE hire)

Hire from FE → `POST /indexer/v1/sessions` → Postgres → **agent polls** `GET /v1/sessions?desk=` on loopback `:42069` each tick.

Public indexer URL: **`https://healthfactor.ammlabs.fun/indexer/`** (single mount).

#### A. Postgres

```bash
cd /opt/am-m
docker compose up -d postgres
docker compose exec postgres pg_isready -U amm -d amm
```

#### B. Two secrets (generate once)

```bash
openssl rand -hex 32   # INDEXER_SECRET
openssl rand -hex 32   # SESSION_KEY_ENCRYPTION_KEY
```

| File | `INDEXER_SECRET` | `SESSION_KEY_ENCRYPTION_KEY` |
| ---- | ---------------- | ---------------------------- |
| `apps/indexer/.env.local` | yes | yes |
| **8×** `agents/<name>/.studio/.env.local` | yes | yes |
| Mac `apps/web/.env.local` | yes | **no** |

#### C. Indexer env

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

#### D. Check indexer

```bash
curl -sS http://127.0.0.1:42069/v1/health
curl -sS https://healthfactor.ammlabs.fun/indexer/v1/health
```

#### E. FE (Mac / Vercel)

```
INDEXER_URL=https://healthfactor.ammlabs.fun/indexer
INDEXER_SECRET=<same as indexer>
```

Restart Next after edit.

#### F. After `git pull`

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

#### G. Hire / indexer troubleshooting

| Symptom | Check |
| ------- | ----- |
| `indexer sessions 401` | `INDEXER_SECRET` agent ≠ indexer |
| `Unsupported state or unable to authenticate data` | rotate encryption key → re-hire |
| `ECONNREFUSED 42069` | indexer not listening; `pm2 logs indexer` |
| hire 502 / `Cannot POST /indexer/` | nginx `location /indexer/` on **443** healthfactor |
| agent idle after hire | `AMM_DESK`, `AMM_AGENT_ID`, encryption key; agent must **poll** GET sessions |
| job page **0 strategy txs** but agent ran | old indexer / scan cursor past tx block → **§7.1 backfill** |
| RPC `History has been pruned` | archive RPC or raise start block |

**Backfill execution log** (after indexer scanner upgrade): reset scan cursor per session so old txs re-index from grant block:

```bash
psql "$DATABASE_URL" -c "DELETE FROM amm.session_scan WHERE session_id = 's-XXXXXXXX';"
# or all active sessions:
psql "$DATABASE_URL" -c "DELETE FROM amm.session_scan;"
pm2 restart indexer
```

**Grant** tx (`grantTx`) intentionally does not count as strategy tx.

---

## 8. HTTPS check (8 agents)

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

Card: `url` HTTPS, skills `negotiate` + `notify_funded`. `/strategy` idle without hire is normal.

---

## 9. ERC-8004 listing (Mac, after HTTPS live)

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

Update `apps/web/lib/catalog.ts`: `wallet`, `registryId`, `endpoint`, `strategyUrl` for all four `*agg`.

---

## 10. Public hire vs settle

A2A `negotiate` → `hireErc8183Agent` → agent works via **user session** on indexer (polled each tick).

`bag erc8183 settle <id> --action approve` — release $U escrow after dispute window (~24h).

Local storage on VPS is fine.

---

## 11. Deploy checklist order

1. VPS: clone, build strategy + 8 agents, Postgres, indexer env
2. Mac: grant conservative sessions (+ aggressive if new)
3. scp `altana-session.json` → VPS → `pm2 restart` (per group of 4)
4. nginx 8 sites + certbot
5. Mac: `erc8004 register` × 8, update `catalog.ts` for aggressive
6. Sync `INDEXER_SECRET` to 8 agents + FE → `pm2 delete all && pm2 start` if env new
7. Hire from FE → verify agent **polls sessions** + `/strategy` + tick logs

Not in this doc: Vercel FE production, TermiX report.
