# Running Am-M locally

This repo is **two worlds**. Do not mix the commands.

```
Am-M/                          ← Turbo + Next.js (marketplace FE)
  apps/web
  apps/docs
  packages/ui, eslint-config, typescript-config
  packages/agent-strategy      ← shared Venus/PCS code; NOT a runnable process

  agents/                      ← OUTSIDE pnpm workspace root (intentional)
    healthfactor/              ← 1 bag process + 1 Altana wallet + 1 ERC-8004 identity
    yieldrouter/
    rebalancing/
    gridtrading/
```

Local run: this document. VPS deploy + ERC-8004 listing: [`DEPLOY.md`](./DEPLOY.md) — **VPS first, then** `bag erc8004 register`.

`pnpm dev` at the **repo root** only starts the Next.js starter. Agents do **not** start with it.

---

## Why 4 agent folders, 4 wallets?

`bag init` creates **one seller = one project = one signer**.

| Must not be shared | Reason |
| ------------------ | ------ |
| Folder `agents/<name>/` | `bag` CLI locks `studio.toml`, `.studio/wallets/`, port, and `pnpm-workspace.yaml` per project. Init name cannot use `-`/`_` (`healthfactor`, not `health-factor`). |
| Altana wallet per agent | ERC-8004 identity + $U recipient (ERC-8183) needs its own address. `bag wallet session grant` binds to that address. |
| Node process per agent | 24/7 tick loop. One crash must not kill other desks. Ports: 9001–9004 (conservative), 9005–9008 (aggressive on VPS). |

User funds do **not** go into agent wallets. Agent wallets only pay gas + receive $U + register on 8004. DeFi positions live in the user smart account via session granted at hire.

`packages/agent-strategy` exists so all four agents do not copy Venus/PCS ABIs four times. It is a library, not an agent.

---

## Why is `.env` not in `app/agent/`?

`bag` loads secrets from:

```
agents/<name>/.studio/.env.local
```

`.studio/` is **fully gitignored** (keystore + session + password). Example env **cannot** live inside `.studio/` — it would not be committed. Safe examples are at `agents/<name>/.env.example`; you copy to `.studio/.env.local`.

Do not put `WALLET_PASSWORD` or 9router API keys in chat, argv, or `.env` under `app/agent/` (deploy location; keystore must not ship in the package).

Agents use **9router** (OpenAI-compatible), not OpenRouter. In `.studio/.env.local`:

```
NINEROUTER_API_KEY=<key from 9router dashboard>
NINEROUTER_BASE_URL=<your host>/v1
OPENAI_API_KEY=<same key>    # bag doctor reads this name
```

Local: `NINEROUTER_BASE_URL=http://127.0.0.1:20128/v1`. Default model `kr/claude-sonnet-4.5` — change in `app/agent/studio.toml` `[llm].model` if you use your own combo.

---

## First run — one agent first (`healthfactor`)

`bag --version` must be **0.0.13** (SDK 0.5.5). CLI 0.0.12 grants sessions in an old format (5 calls without `signature`); runtime 0.0.13 rejects that. Upgrade: `npm install -g @bnbagent/studio-cli@0.0.13`. After upgrade, run `bag wallet session grant --force` again.

In **your terminal** (not via chat):

```bash
cd agents/healthfactor
mkdir -p .studio
cp .env.example .studio/.env.local
chmod 600 .studio/.env.local
# set WALLET_PASSWORD, NINEROUTER_API_KEY, NINEROUTER_BASE_URL
# (OPENAI_API_KEY = same 9router key so bag doctor passes)
```

Then:

```bash
cd agents/healthfactor
pnpm install

cd app/agent
bag wallet new
# prints admin address → fund ≥ 0.02 tBNB + ≥ 1 $U
# tBNB faucet: https://www.bnbchain.org/en/testnet-faucet
# $U faucet:   https://united-coin-u.github.io/u-faucet/

bag wallet session grant --force --budget-u 5 --expiry-days 90 --yes
cd ../..
bag doctor
bag dev
```

Verify it is up — **that process’s port**, not 9000 unless Guard runs without `--port`:

```bash
curl -s http://localhost:9001/.well-known/agent-card.json   # healthfactor with --port 9001
curl -s http://localhost:9000/.well-known/agent-card.json   # healthfactor default `bag dev`
curl -s http://localhost:9002/strategy                       # rebalancing
curl -s http://localhost:9003/strategy                       # gridtrading
```

If all four agents run, `:9000` is almost always **Guard** (whichever secondary bind wins). Grid = `:9003`.

Without `USER_SESSION_FILE` or indexer `INDEXER_URL`, strategy ticks stay **idle** (no Venus tx). That is normal: `bag wallet session grant` creates the **agent** session (8183 quotes), not permission over user funds.

Without FE, user testing still uses **Altana** (not MetaMask). Scripts swap passkey for EOA admin:

```bash
cd agents/healthfactor/app/agent
pnpm grant-user-session
# prints address → fund ≥ 0.02 tBNB (+ Venus testnet USDT so mint works)
# run again after funds arrive
# add USER_SESSION_FILE=... to .studio/.env.local, restart bag dev
```

Session file: `.studio/user-session.json` (mode 0600, gitignored). Do not paste contents in chat.

**Rebalancing** (PCS LP), from `agents/rebalancing/app/agent` — reuse Guard test user wallet, **new session** (NFPM allowlist):

```bash
cd agents/rebalancing/app/agent
pnpm grant-user-session
# add USER_SESSION_FILE=... to agents/rebalancing/.studio/.env.local
# restart: bag dev --port 9002
```

Needs USDT + WBNB in user wallet. Script wraps 0.02 tBNB → WBNB if WBNB is 0.

**Grid** (PCS swap), from `agents/gridtrading/app/agent` — same test user wallet, **new session** (SwapRouter allowlist, not NFPM):

```bash
cd agents/gridtrading/app/agent
pnpm grant-user-session
# add USER_SESSION_FILE=... and ERC8183_AGENT_URL=http://127.0.0.1:9003/erc8183
# to agents/gridtrading/.studio/.env.local
# restart: bag dev --port 9003
curl -s http://localhost:9003/strategy
```

First tick is usually `noop` (grid armed). Swaps only when pool tick moves past variant threshold. Do not copy Rebalance `USER_SESSION_FILE` to Grid.

**Yield** (Venus mint matching underlying), from `agents/yieldrouter/app/agent` — same test user wallet, **new session** (mint/redeem, no repay):

```bash
cd agents/yieldrouter/app/agent
pnpm grant-user-session
# add USER_SESSION_FILE=... and ERC8183_AGENT_URL=http://127.0.0.1:9004/erc8183
# to agents/yieldrouter/.studio/.env.local
# restart: bag dev --port 9004
curl -s http://localhost:9004/strategy
```

Tick parks idle USDT/USDC/BNB into matching vToken. Do not copy Grid/Rebalance sessions. Hire 8183 soon after tick (30-minute deadline).

---

## Production hire path (indexer session poll)

When the marketplace FE is running with indexer:

1. User grants session in browser → `apps/web` POST `/api/sessions` → indexer `POST /v1/sessions` → Postgres (encrypted envelope, `agentId`, `desk`).
2. Agent each tick: `GET /v1/sessions?desk=` via `INDEXER_URL` + `INDEXER_SECRET` (see `packages/agent-strategy/src/sessions.ts`).
3. Agent filters rows by `AMM_AGENT_ID` (e.g. `yieldrouteragg` only picks aggressive hires for that agent).

Local dev without indexer continues to use `USER_SESSION_FILE` or `USER_SESSIONS_DIR` under `data/sessions/<desk>/`.

---

## All four agents at once (later)

Each terminal, from that agent’s folder:

| Agent        | `bag dev --port` |
| ------------ | ---------------- |
| healthfactor | 9001             |
| rebalancing  | 9002             |
| gridtrading  | 9003             |
| yieldrouter  | 9004             |

`bag dev` locks port **before** subprocess: `AGENT_PORT=9002 bag dev` is **not** enough — CLI still probes 9000. Use `--port`:

```bash
cd agents/healthfactor && bag dev --port 9001
cd agents/rebalancing  && bag dev --port 9002
cd agents/gridtrading  && bag dev --port 9003
cd agents/yieldrouter  && bag dev --port 9004
```

`--port` sets `AGENT_PORT` for the entrypoint. Scaffold still tries 9000 and 8088. Agents 2–4 log `secondary contract port unavailable` — **safe to ignore** if `--port` is unique.

Do not run `bag wallet new` twice in the same project (new keystore breaks sessions).

---

## Two session types (do not confuse)

1. **Agent session** — `bag wallet session grant` in the agent folder. Required so `bag dev` can sign 8183 quotes. Not for Venus mint on user vault.
2. **User session** — result of passkey `grantSession` at `/hire`. Browser POST to Next `/api/sessions`; Next forwards to indexer VPS (encrypted Postgres, see `DEPLOY.md` §7.1). Agent **polls indexer each tick** via `GET /v1/sessions`. Local demo without FE: `USER_SESSION_FILE=...` (mode 0600).

---

## Aggressive variants locally

Aggressive agents live in `agents/<name>agg` (e.g. `healthfactoragg`). Same code via symlink; separate wallet and `AGENT_VARIANT=aggressive`. On VPS they use ports 9005–9008 and URLs like `https://healthfactoragg.ammlabs.fun/`. Scaffold: `./scripts/scaffold-aggressive-agents.sh`.
