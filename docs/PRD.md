# Am-M — Product Requirements Document

**Working name:** Am-M (Agent Marketplace)  
**Public name (proposed):** Am-M  
**Tagline:** Hire a DeFi agent. You keep the keys.  
**Hackathon:** [The Smart Money Era: Build the Era](https://www.bnbchain.org/en/hackathons/smart-money-era?tab=overview) (5 Aug – 9 Sep 2026)  
**Status:** Draft for build  
**Last updated:** 29 Aug 2026

This is the source of truth for what we ship. Hackathon rules live in [`Hackathon.md`](./Hackathon.md). This document turns those rules into a product that can actually win.

---

## 1. Why this product exists

BNB Chain already has an agent stack:

| Layer | Standard / product | Role |
| --- | --- | --- |
| Identity | ERC-8004 + [8004scan](https://8004scan.io) | Who the agent is, reputation, feedback |
| Commerce | ERC-8183 + $U escrow | Hire, fund, deliver, settle / dispute |
| Payments | x402 / B402 | Pay per call |
| Runtime | [BNB Agent Studio](https://www.bnbchain.org/en/bnb-agent-studio) (`bag` CLI) | Scaffold, deploy, earn |
| Authority | [Altana](https://docs.altana.network) Keystore + session | Agent transacts within user-set limits |

What **does not exist yet** is the front door: where a normal user lands, picks a job, understands the agent, and hires in a few clicks. 8004scan is an explorer for 200k+ identities. TermiX is an agent that hires agents. Neither is the canonical hire desk for DeFi jobs on BSC.

The main-track prize is not a trophy. The winner is **officially adopted as the BNB Agent Studio marketplace**. Judges say it plainly: this is not a demo day. What we ship here is what real users touch next.

---

## 2. Strategy (how we win)

**One product, four prize shots.** Do not split into four demos. The marketplace *is* the submission for every track.

| Track | Prize | What they actually score |
| --- | --- | --- |
| **Main** | $30k + official adoption | End-to-end hire journey, data that makes people willing to hire, all four categories at equal depth |
| **Altana** | 50,000 XP | Live onchain tx in the Altana explorer. Agents on Altana wallets. Sessions with allowlist + spend cap + expiry, registered in Keystore. User can view and revoke. Bonus: `hireErc8183Agent` + sell x402 |
| **TermiX** | $6k / $3k / $1k | They hire from our marketplace themselves. Agent must beat DIY, proven in the Agent Advantage Report |
| **PancakeSwap** | 1,000 CAKE | Real benefit for PCS traders or LPs — not a banner |

### Competitive thesis

Do **not build another agent directory**. A directory of 200k ERC-8004 NFTs loses on Data Quality and Functionality.

Build a **job desk** with four first-class desks. Agents are the workers behind a job, ranked with live protocol data so users can hire without reading docs.

### What Phase 2 may test (still hidden from organizers)

Assumption: production URL, mainnet or near-mainnet reliability, empty/error states, no dead ends, someone with zero Agent Studio knowledge can complete a hire, and “would we actually put this on bnbchain.org”. Build for adoption, not for a judge walkthrough.

### Hard constraints from the brief

- Submission must be **functional and publicly accessible** during judging.
- Marketplace agents must be **live on BSC**.
- Single-category submissions score poorly. **All four categories, equal depth.**
- TermiX report must be planned **from day one** (3 real tasks, both directions, at least one trading/equities/security).
- Altana prize requires **live tx visible in their explorer** and wallet address in the submission.

### Product decision (29 Aug): agents must execute, not report

**Activate = grant session + pay 8183 + agent opens/manages on-chain positions.** Not alerts. Not “click yourself in MetaMask.”

User funds live in an Altana smart account (passkey). The agent opens **new** positions there. No “move LP from MetaMask.” MetaMask is optional only as a faucet to transfer into `wallet.address`.

Guard **must not** be alert-only as the main product. If HF breaks, the agent repays/supplies within cap, or the job fails honestly (nothing executed because of cap/permission) — not “we emailed you.”

### Locked decisions from reference (29 Aug, evening)

Reference: [`referensiprd.md`](./referensiprd.md) v0.8 and [`referensitechspec.md`](./referensitechspec.md) v0.6 (`bag` 0.0.12 + chain probe 24 Aug). Those are **inputs**, not documents to overwrite blindly. Below: what enters Am-M, what we reject, and what we merge.

#### Adopt (write as product truth)

1. **Four keys — do not confuse them**

   | Component | Holder | Role |
   | --- | --- | --- |
   | Altana wallet **user** | User, **passkey** (Face ID) | User’s only working account. Capital + DeFi positions. Not MetaMask. |
   | Session **user→agent** | Agent process (VPS), encrypted in DB | Narrow permission on user wallet. One per user–agent pair. |
   | Altana wallet **agent** | Team, admin keystore on dev machine | ERC-8004, receive $U, gas. Never holds user funds. |
   | Session **agent** | Runtime (`ALTANA_SESSION`) | On the server. Not the admin keystore. |

2. **FE without extension.** Passkey = account. No Connect Wallet. MetaMask at most an optional “send to this address” button on fund step. Remove open question “EOA sign createWallet”.

3. **One user wallet, many sessions.** Second hire = grant a new session, not passkey + fund again. Fund isolation via cap/allowlist per session, not wallet walls (second wallet allowed, not default).

4. **New positions inside Altana, not moving old LP from EOA.** Agent cannot become owner of MetaMask LP NFTs. UI is honest: “we open positions in your working account.” Users with existing Venus/PCS positions on EOA are not auto-protected.

5. **User approves protocol once via admin path; agent opens positions via session.** First session tx = proof for Altana track. Hire screen must preview: pool, range, amount. `approve`/`transfer` **not** in allowlist.

6. **Function-level allowlist.** Rebalance: `mint`/`burn`/`increaseLiquidity`/`decreaseLiquidity`/`collect` on PCS V3 NFPM. Grid: swap on router (PCS has **no** on-chain limit orders). Yield/Guard: `mint`/`redeem`/`repayBorrow` on Venus vTokens. Product claim: max loss **computable** (cap + expiry + allowlist), not “agent cannot steal” — Altana does not bind args (`to` on swap/collect). Dashboard verifies recipients.

7. **Variants, not 1 agent per desk.** Main track wants *informed call which to hire*; TermiX wants *compare*. Minimum 2 profiles per category (conservative vs aggressive) from 4 codebases = 8 hireable agents. 8004scan allowed, **separate strip, not hireable** — dead Hire button = dead end.

8. **Host agents on VPS, not AgentCore.** Scale-to-zero + OAuth Cognito kills guard loops and public hire (TermiX/judges). `bag deploy` not required for track. ERC-8004: `bag erc8004 register --endpoint <public url>`. Tick loop in `unifiedMain.ts` (scaffold has no scheduler). `bag init` name without `-`/`_` (`healthfactor`, not `health-factor`).

9. **Three honest data layers — do not mix FE and agent brain.**

   | Layer | Chain | Used by | UI label |
   | --- | --- | --- | --- |
   | Market context (Venus APR, PCS pool TVL/volume/fee) | **BSC mainnet (56)** | **FE catalog only** — hire decision | Live |
   | User positions, tick, HF, triggers, tx | **BSC testnet (97)** | **Agent** (read + execute) | Live (testnet) |
   | Track record N rebalances / win rate | Testnet | FE + TermiX | Live (testnet) |
   | Historical backtest | Mainnet data | FE | **Simulated** |

   Agent **must not** follow mainnet price/APR then `execute` on testnet. Triggers always use testnet state. Mainnet on cards = context, not strategy input. Agents must run before FE is ready (track record cannot be caught up at the end).

10. **Yield v1 = one execution protocol: Venus.** On testnet ticker `USDT` maps to two contracts (Venus `0xA11c8D9D…` ≠ mock PCS `0x337610d2…`). No bridge. Yield agent **must not** promise “move Venus → PCS/Lista/Aave”. Job: `mint`/`redeem` across vUSDT, vUSDC, vBNB per **testnet** Venus APR. Two variants (conservative vs aggressive APR gap threshold) remain. Lista/Aave/PCS **mainnet** APR on cards as labeled context, copy: “hired route on testnet: Venus.” Rebalance/grid use WBNB/USDT(**Venus**) fee-100 pool, not mock PCS; seed if 0.29 WBNB is too thin. Full addresses: tech spec §1.1.

11. **`/account` page (UI label: Account) — one hub, not a Hire modal.** Signup, fund, balance, active agents, revoke, withdraw live here. Altana has no hosted login; Face ID on this page = `createPasskeyWallet`.

   **Browse stays free** (home + desk + detail). Header: **Account**. Hire without account → `/account?next=/hire/[id]` (not a popup).

   `/account` contents:

   | State | Shown |
   | --- | --- |
   | No account | One CTA **Create account** → Face ID → address appears |
   | Account, unfunded | Address, copy, QR, faucets, polling “waiting for funds” |
   | Ready | Balances, protocol approvals, active agents (cap, expiry, Revoke), P&L, Withdraw |

   Biometric prompts stay 3 on first hire (create account, approve, grant), but **create account + fund + withdraw** are not embedded in the hire form. Hire page only: preview permissions + grant + pay $U. Next hires: 1 prompt. Return visits: `recoverFromPasskey` on `/account`, no login form.

   Do not label the page “Wallet” / “Smart account” in nav. **Account** only.

12. **Two fees — only $U is collected.**

   | | **$U (ERC-8183)** | **Performance fee** |
   | --- | --- | --- |
   | What | Pay hire service to agent wallet | % of user DeFi position profit (e.g. 10%) |
   | Hackathon | **Collect** (escrow, testnet $U faucet) | **Do not collect** — dashboard number only |
   | Display formula | list price + job id | `max(current_value − deposit − gas, 0) × bps` |
   | On withdraw | n/a | User gets **full** position; no `transfer` to us |

   “Accrued performance fee” = live spreadsheet (deposit, running value, gas, fee *as if* paid) so net APY can be shown. Not an on-chain deduction. Do not put `transfer` in session allowlist. Collect via admin on withdraw = bonus, not v1.

13. **Indexer: [Ponder](https://ponder.sh).** `apps/indexer` indexes BSC testnet (execution, Keystore, 8183 jobs, P&L per session) plus read-only mainnet for market context layer. Type-safe EVM indexing, API consumed by `apps/web`. Not Next route handlers as the primary indexer. Deploy indexer + Postgres on VPS (Docker Compose); FE on Vercel.

#### Reject / do not copy verbatim

- **Hire = session only, ERC-8183 bonus only.** For Am-M, session = **authority over funds**. ERC-8183 stays **in-scope** as service payment ($U) — scaffold is live, TermiX needs paid-looking hire, Altana bonus mentions `hireErc8183Agent`. Not “session without payment” and not “8183 without session.”
- **Demo book removed.** Reference dropped it because passkey + fund + agent opening positions already lets TermiX/judges activate without “move LP from MetaMask.” Demo book only if passkey spike fails on judge device.
- **Two-layer Python / `app/service` / port 8080.** Stale vs CLI 0.0.12. Do not use old docs.bnbchain.org deployment.
- **Free Pieverse + Altana.** Incompatible (SIWE). LLM = [9router](https://github.com/decolua/9router) (our OpenAI-compatible endpoint); variant code clamps LLM proposals, LLM never `execute`s.
- **Custom vault / mandatory on-chain fee.** Out of scope; breaks non-custodial model.
- **One Node process for 4 categories.** Four processes, different `AGENT_PORT`; scaffold always tries 9000/8088 (warnings on agents 2–4 are normal).

#### Merged Activate flow

```
Browse catalog (no account)
  → pick variant
  → create passkey account
  → fund wallet.address
  → approve protocol (admin, first execute / Keystore)
  → review scope + first action
  → grantSession (authority) + hire ERC-8183 (pay $U)   ← both
  → tick 1: agent opens position via session (tx in Altana explorer)
  → tick loop until expiry / revoke
  → dashboard + revoke + withdraw (admin)
```

Activate = live session **and** strategy tx out, not PDF, not MetaMask popup.

---

## 3. Product vision

Am-M is where you go when you have idle capital or open DeFi risk and want an agent to run a specific job 24/7 without handing over keys.

Four jobs, equal product weight:

| Desk | User job | Agent work |
| --- | --- | --- |
| **Rebalance** | My LP is out of range / I don’t want to watch ticks | Manage PancakeSwap LP range, reset positions |
| **Grid** | I want buy-the-dip / sell-the-rip on a pair without staring at a screen | Place and manage automated grid orders |
| **Yield** | Idle tokens should earn the best available APR | On testnet: rotate across **Venus** vTokens. Cards may show other protocol APR (mainnet, context) |
| **Guard** | Don’t get liquidated while I sleep | When HF breaks: repay/supply within cap — tx, not notification |

Users do not need to know ERC-8004, ERC-8183, or Agent Studio. They pick a desk, compare agents, set budget and time limit, hire, then monitor the job and kill the session in one click.

---

## 4. Users

### Primary — DeFi user (human)

Has a wallet, some positions on BNB Chain (LP, lending, idle stables), little or no Agent Studio knowledge. Success = hire an agent and understand what it is allowed to do.

### Secondary — agent buyer (TermiX / other agents)

Hire via the same public flow or documented A2A/ERC-8183 path. TermiX judges will do this themselves. Success = no instruction manual needed.

### Tertiary — agent seller (us first, others later)

First-party: we ship four live seller agents so the marketplace is not empty. Later: any ERC-8004 agent on BSC declaring one of four categories can list. v1 UI listing beyond our four agents is out of scope, but the data model must not be hard-coded to only our agents.

---

## 5. Success metrics (mapped to judging)

We do not invent vanity KPIs. We instrument what judges score.

### Main track

| Criterion | Product bar |
| --- | --- |
| **Functionality** | Cold user: land → pick desk → open agent → understand → **activate** (hire that produces tx, not a report) → see job + hash. Zero dead ends. Copy never says “see docs”. |
| **Data Quality** | Every agent card shows more than name/count. Enough live numbers to pick A over B. Stale data labeled. Missing data = explicit empty state, not fake zero. |
| **Agent Diversity** | 4 desks × ≥2 variants, equal IA depth, comparable. 8004scan must not be a dead Hire button. |

### Altana

Qualification (all must be true, or we are participant not winner):

1. Every first-party seller agent has its **own Altana wallet**.
2. Buyer grants **session** with call allowlist, spend cap, expiry.
3. Session **registered in Keystore** (default `grantSession`, not `register: false`).
4. At least one **real onchain tx via that session key**, visible in Altana explorer (testnet counts, mainnet stronger).
5. **Session panel** in product: permission, remaining cap, expiry, **Revoke**.

Bonus: hire seller with `hireErc8183Agent`; at least one seller face on x402/B402 if wallet type allows. Note: Agent Studio **rejects paid B402 sell on Altana seller wallet**. First-party sellers use ERC-8183 as paid rail. Optional free x402 passthrough allowed; paid B402 is a wallet-type decision later, not a v1 blocker.

### TermiX

| Weight | Bar |
| --- | --- |
| 30% service value | Agent returns real work at price/speed that beats DIY |
| 30% proven advantage | Agent Advantage Report (see §12) |
| 20% high-stakes categories + track record | Grid + rebalance carry win rate, window, risk taken |
| 20% marketplace quality | Same as Main Functionality |

### PancakeSwap

At least two PCS desks (**Rebalance** + **Grid**) deliver measurable benefit (in-range / fee / fill). Yield testnet is not routed to PCS.

---

## 6. Scope

### In — v1 (hackathon ship)

1. Public marketplace at a stable URL (web app).
2. Four desks × **minimum 2 variants** (conservative/aggressive), all **live** on BSC testnet.
3. First-party discovery + 8004scan strip **separate and not hireable**.
4. Activate: passkey → fund → admin approve → `grantSession` + `hireErc8183Agent` → agent opens position via session → tick → dashboard / revoke / withdraw.
5. Session control UI (view, remaining budget, revoke).
6. Agent Advantage Report artifact from real runs (not made-up numbers).
7. Ponder indexer + Postgres (testnet execution/P&L/Keystore; mainnet FE context).

### Out — v1

- Building a general ERC-8004 explorer (8004scan already is that).
- Custodial wallet, shared treasury, or “we sign for you”.
- Token launch, points, leaderboard as product.
- Multi-chain UI (BSC only).
- Seller onboarding portal / KYC.
- Paid B402 on Altana seller wallet (protocol limitation).
- Native mobile app.
- Auto-settle ERC-8183 jobs (Studio / SDK leaves approve-reject-dispute to buyer).
- Collect performance fee (display only). Custom vault.
- Managing existing DeFi positions on user EOA (positions opened fresh in Altana wallet).

### Later (only if v1 is solid)

- Third-party seller listing from 8004scan semantic search, filtered to four desks.
- Agent-to-agent hire (TermiX style) as first-class buyer type.
- Historical PnL charts beyond v1 track-record strip.

---

## 7. User journeys

### J1 — Cold hire (Functionality golden path)

1. Land on `/`. Headline states four jobs. No protocol jargon on first screen.
2. Click a desk (e.g. Rebalance). See agents **for that desk only**, each with live desk metrics (not generic cards).
3. Open agent. Read: what it **executes**, allowlist, $U price, reputation, last tx, track record.
4. Activate. No account yet → `/account?next=/hire/[id]` (Create account = Face ID on **Account page**, not redirect to altana.network).
   - On `/account`: fund `wallet.address` (faucet/QR). MetaMask optional for inbound transfer only.
   - Back to hire: approve protocol (admin) → review allowlist + first action → `grantSession` → pay `hireErc8183Agent`.
5. First tick: agent opens position via session (tx in Altana explorer). Loop until expiry/revoke.
6. Dashboard: hash, P&L, remaining cap, Keystore status. 8183 job: FUNDED → SUBMITTED when paid rail used.
7. Anytime: Revoke session (passkey) or withdraw funds (admin path).

Someone with zero Agent Studio knowledge must complete J1 without a README.

### J2 — Compare then hire (Data Quality)

On desk list, user sorts/filters by metrics that matter for that job (APR, HF headroom, % in-range, grid win rate, price, reputation). Side-by-side two agents is nice-to-have; sortable columns required.

### J3 — Kill switch (Altana)

User opens **/account** (active agents section), sees allowlist + cap + expiry, clicks Revoke.

### J4 — TermiX hire (no human chrome)

Same hire endpoints as J1, documented enough for TermiX to complete a job from the public site. Deliverable fetchable (`getErc8183DeliverableUrl`) and verifiable against onchain hash.

---

## 8. Information architecture

```
/                       Home — four desks, browse without account
/desks/*                List + filter + live metrics
/agents/[id]            Profile; Hire CTA
/account                Hub: create account, fund, balance, active agents, revoke, withdraw
/hire/[id]              Permission preview + grant + pay $U only
                        (no account/funds → redirect /account?next=)
/jobs/[jobId]           8183 job status + deliverable
/report                 Agent Advantage Report (TermiX)
```

`/sessions` is not a route; content lives under `/account`.

Copy rules:

- First-screen language: jobs, not standards. Signup: “Create account” = passkey in this app.
- Protocol names (ERC-8004, 8183, Keystore) appear on agent/session pages as **proof**, with explorer links, not as prerequisites.
- Every CTA that can fail has recovery (faucet, retry, “agent offline — pick another”).

---

## 9. Data quality (more than counts)

8004scan is necessary and **not sufficient**. It gives identity and reputation. It does not tell you whether to hire a rebalancer today.

### Shared fields (every agent)

| Field | Source | Why |
| --- | --- | --- |
| Name, description, image, services (A2A/MCP) | ERC-8004 registration / 8004scan | Identity |
| Chain, tokenId, owner | 8004scan `GET /agents/{chainId}/{tokenId}` | Verifiable |
| Reputation + recent feedback | 8004scan feedback | Trust |
| List price ($U) + SLA | Agent card / seller config | Hire decision |
| Last seen / endpoint health | A2A/MCP probe or last onchain tx | Avoid dead agents |
| Jobs completed, dispute rate | Indexed ERC-8183 job history | Track record |
| Wallet + Keystore session (if Altana) | Altana explorer + Keystore read | Authority |

Use hackathon Pro tier: create 8004scan API key via [Pro-Tier Upgrade Form](https://www.bnbchain.org/en/hackathons/smart-money-era?tab=resources). Key stays on server. Browser never holds 8004scan key.

### Live fields per desk (Data Quality win)

| Desk | Live numbers user sees | Chain / protocol |
| --- | --- | --- |
| **Rebalance** | In-range vs out-of-range, current tick vs range, 24h fee estimate, last rebalance age, simple IL vs HODL | PancakeSwap v3 |
| **Grid** | Pair, grid bounds, filled bid/ask, realized PnL in window, max drawdown, win rate | PancakeSwap spot / limit-style fills we execute |
| **Yield** | Venus vToken APR testnet (execution); Lista/Aave/PCS **mainnet** APR on card as labeled context | Venus only (execution). Do not mix mock PCS USDT |
| **Guard** | Current health factor, liquidation price, buffer to liq, last action hash, estimated time to liq | Venus Comptroller + vToken |

Refresh: poll ~15–60s on open agent page; list pages 60–120s. Show “as of {time}”. Do not invent green numbers.

### Indexer — [Ponder](https://ponder.sh)

One `apps/indexer` app (Ponder + Postgres). `apps/web` only consumes its API.

Ponder testnet (97):

1. Keystore: `getKeys` + `isValidKey` per session (status, time left, cap).
2. `execute` history per session + recipient verification (all `to` == user wallet).
3. Position / P&L / **displayed** performance fee snapshots (not collected).
4. ERC-8183 jobs (jobId, status, deliverable URI).

Ponder/read mainnet (56), read-only:

5. Venus APR, PCS pool TVL/volume/fee, pair volatility — FE context layer.

Also periodic 8004scan sync (server-side API key). Do not scrape Altana UI. Do not dump 200k agents. Seed our 8 hireable agents; 8004scan strip separate, not hireable.

---

## 10. Four first-party agents (equal depth)

Scaffold with BNB Agent Studio (`bag`). Each is a **seller**: ERC-8004 identity, ERC-8183 `negotiate` / `notify_funded`, Altana wallet, live on BSC.

**Invariant:** signing is fixed handler code, not an LLM tool. LLM may read chain state and propose; execution goes through Altana session policy.

Each agent gets the **same product surface**: card, detail metrics, hire task template, deliverable schema, post-hire monitor. Internals differ, depth equal.

### 10.1 Rebalance — `rebalancing`

- **Sells:** “Keep this PCS position in-range under cap C until time T.”
- **Skills:** PancakeSwap Liquidity (extend to **v3 range** if public skill is v2-only).
- **Deliverable:** tx hash, old range → new range, fees collected, in-range time.
- **PancakeSwap bounty:** smarter liquidity management.
- **Session allowlist:** PCS v3 NPM, pool, router, $U, WBNB. Spend cap = max add-liquidity + fees.

### 10.2 Grid — `gridtrading`

- **Sells:** “Run grid on PAIR between LO and HI, N levels, until T or cap C.”
- **Skills:** PancakeSwap Trading + Token Radar.
- **Deliverable:** fills, inventory, realized PnL, win rate, drawdown, window.
- **TermiX:** required **trading** task.
- **Track-record strip:** win rate, window, risk taken. Required for TermiX 20%.

### 10.3 Yield — `yieldrouter`

- **Sells:** “Park A on Venus; rotate vToken if testnet APR gap exceeds variant threshold.”
- **Execution:** Venus only (`mint` / `redeem` / `redeemUnderlying` on vUSDT, vUSDC, vBNB).
- **FE:** Lista/Aave/PCS mainnet APR allowed, labeled context. Not a button for unroutable paths.
- **Deliverable / dashboard:** start vToken → end vToken, hash, test APR vs realized.
- **Accepted blocker:** Venus USDT ≠ mock PCS USDT; no cross-protocol yield on testnet.

### 10.4 Guard — `healthfactor`

- **Sells:** “If Venus HF < threshold, repay/supply within cap C until T.”
- **Execution:** Venus Comptroller + vToken. Aave not v1 testnet.
- **Deliverable:** HF timeline, **rescue tx hash** (or honest revert/cap exhausted), new HF.
- **Not the product:** hire that is alert/report only.
- **Session:** `repayBorrow` / `mint` only; spend cap limits rescue size.

### Seller config (all four)

- Network: `bsc-testnet` first, `bsc-mainnet` if time and wallet funded.
- Wallet: `altana` (required for Altana track).
- Rail: paid ERC-8183. Optional free x402.
- Face: A2A + X402 (Studio default). MCP optional.
- Deploy: **VPS** (pm2/systemd + HTTPS reverse proxy), not AgentCore. Register ERC-8004 to public URL. Do not rely on `bag deploy --provider bnb` 48h trial.
- 8183 deliverable: public URL (VPS disk enough for v1).

### Hire task templates (so J1 is not an empty prompt)

Each desk: 2 variants (conservative/aggressive) with form fields (amount, pair, HF threshold). First-action preview required before grant. Default = open position in **user** wallet. Demo book fallback only if passkey spike fails. Deliverable/dashboard must include tx hash.

### Public agent URLs (production)

Conservative and aggressive variants use the agent folder name + `agg` suffix on the same domain pattern:

| Agent | URL |
| --- | --- |
| healthfactor | https://healthfactor.ammlabs.fun/ |
| rebalancing | https://rebalancing.ammlabs.fun/ |
| gridtrading | https://gridtrading.ammlabs.fun/ |
| yieldrouter | https://yieldrouter.ammlabs.fun/ |
| healthfactoragg | https://healthfactoragg.ammlabs.fun/ |
| rebalancingagg | https://rebalancingagg.ammlabs.fun/ |
| gridtradingagg | https://gridtradingagg.ammlabs.fun/ |
| yieldrouteragg | https://yieldrouteragg.ammlabs.fun/ |

Indexer API (single mount): https://healthfactor.ammlabs.fun/indexer/

---

## 11. Architecture

```
┌─────────────────────────────────────────────────────────┐
│  apps/web  (Next.js / Vercel)                           │
│  Passkey Altana · desks · hire · dashboard              │
└────────────┬────────────────────────────┬───────────────┘
             │ HTTPS                      │
             ▼                            ▼
┌────────────────────────┐    ┌───────────────────────────┐
│  apps/indexer (Ponder) │    │  Altana SDK (browser)     │
│  Postgres on VPS       │    │  createPasskeyWallet      │
│  testnet 97: Keystore, │    │  grantSession / revoke    │
│    execution, P&L,8183 │    │  hireErc8183Agent         │
│  mainnet 56: APR/TVL   │    └───────────────────────────┘
│    (read-only, FE)     │
│  REST: POST/GET        │
│    /v1/sessions        │
│  8004scan proxy        │
└────────────┬───────────┘
             │
             │  Hire: web POST encrypted session → Postgres
             │  Tick: agent GET /v1/sessions?desk= each loop
             ▼
   BSC + Keystore + Venus + PCS V3 + $U

┌─────────────────────────────────────────────────────────┐
│  agents/*  (VPS, 8 processes :9001–9008)                │
│  Tick + A2A · poll sessions from indexer · decrypt in   │
│  memory · executeSessionCalls · ALTANA_SESSION (agent)  │
│  Local dev fallback: USER_SESSIONS_DIR / USER_SESSION_  │
│  FILE under data/sessions/<desk>/                       │
└─────────────────────────────────────────────────────────┘
```

### Repo layout (target)

```
apps/web                 Marketplace UI (Next.js)
apps/indexer             Ponder + Keystore / execution / P&L / market schema
packages/ui              Shared UI
packages/agent-strategy  Shared Venus/PCS strategy + session poll
agents/rebalancing       bag (no hyphen in name)
agents/gridtrading
agents/yieldrouter
agents/healthfactor
agents/*agg              Aggressive variants (symlink to conservative)
docs/PRD.md              Product source of truth
docs/Hackathon.md
docs/referensiprd.md     Reference input
docs/referensitechspec.md
docs/agent-advantage.md  TermiX report (filled during build)
```

`apps/web` exists as Turbo starter. Replace starter home; do not start a second app.

### Wallet / key rules

- User is admin. Agent never sees admin key.
- Session **user→agent** (not admin passkey) sent HTTPS to VPS, stored encrypted, decrypted only in tick memory. Altana model (“hand session to the agent”), not admin-key custody.
- `ALTANA_SESSION` = **agent** wallet session. Do not confuse with user session.
- 8004scan API key and RPC URLs are server env only.

### Hire implementation

Use Altana atomic buyer helper, not a hand-rolled five-step escrow:

```ts
const { jobId } = await hireErc8183Agent(session, {
  provider: sellerAddress,
  task: templatedTaskString,
  budget: parseUnits(budgetUi, 18),
}, { network: bscNetwork });
```

Then poll `getErc8183Job` and `getErc8183DeliverableUrl`. Verify keccak256 manifest against `job.deliverable` before rendering content.

### Session poll (production path)

1. User grants session in browser → `apps/web` POST `/api/sessions` → indexer `POST /v1/sessions` → encrypted row in Postgres (`agentId`, `desk`, envelope).
2. Each agent tick: `@am-m/agent-strategy` `loadUserSessions()` → `GET /v1/sessions?desk=` with `INDEXER_SECRET`, filter by `AMM_AGENT_ID`, decrypt with `SESSION_KEY_ENCRYPTION_KEY`, deserialize Altana session, run strategy.
3. Local dev without indexer: `USER_SESSION_FILE` or `USER_SESSIONS_DIR` under `data/sessions/<desk>/` (same deserialize path, no Postgres).

---

## 12. Agent Advantage Report (TermiX, day one)

Required for eligibility. 30% of score. Plan runs in week 1, not the night before submit.

### Format

Publish at `/report` and attach the same markdown in submission.

For **each** of ≥3 tasks:

| Column | Contents |
| --- | --- |
| Task | Concrete, repeatable |
| Without agent | Human DIY: steps, time, cost (gas + time), output artifact |
| With agent | Hired on Am-M: time, $U paid, gas, output artifact |
| Quality | Side by side, judged on truth not prose |
| Links | Tx hash, jobId, deliverable URL |

At least one task must be **trading** (grid). Suggested set:

1. **Trading:** Grid on liquid PCS pair for fixed window. Compare to 3–5 manual swaps. Report win rate, window, drawdown.
2. **Yield:** Rotate Venus vToken (test APR). Compare to human in Venus UI. Do not claim Lista/Aave/PCS on DIY vs agent unless both are Venus.
3. **Guard or Rebalance:** Either (a) compute HF and recommend repay vs doing it in Venus UI, or (b) detect out-of-range LP and reset vs manual PCS v3.

Do not fake the DIY side. Screen record or tx history. Attach real outputs.

---

## 13. UX / design system

Product rules: journey, IA, copy, states, data density. Not the palette.

Visual FE (color, type, cards, CTA) follows Stitch in [`apps/web/DESIGN.md`](../apps/web/DESIGN.md). That file is visual spec only. If Stitch copy conflicts with §7–8, PRD wins.

- One product, four rooms (Rebalance, Grid, Yield, Guard) — not four landing pages.
- First screen: jobs, not protocol names. ERC-8004 / 8183 / Keystore on agent and session pages as **proof**, with explorer links.
- Dense data: tables and ticks, not empty crypto hero or made-up numbers. “Not measured yet” beats fake SLA.
- Explorer link on every onchain fact (BscScan, 8004scan, Altana explorer).
- Desktop first (judges at 1280px). Mobile readable, not the design target.
- `/account` is the hub: create account (passkey in this app), fund, balance, active agents, revoke, withdraw. Not “connect MetaMask.” `/sessions` is not a route.
- `/hire/[id]` only permission preview + first action + grant. No account/funds → `/account?next=`.
- Every fallible CTA has recovery (faucet, retry, agent offline).

---

## 14. Non-functional requirements

| Area | Bar |
| --- | --- |
| Public URL | HTTPS, up for entire judging window |
| **Chain** | Execution + hire: BSC **testnet 97**. FE context: **mainnet 56** read. Do not mix triggers. |
| **Indexer** | Ponder + Postgres on VPS; FE does not index itself |
| Latency | Desk list < 2s with cache; live detail fields may stream in |
| Failure | RPC/8004scan down → last-good cache + banner; disable hire if we cannot verify |
| Secrets | `.env` gitignored; no keys in client bundle |
| Accessibility | Hire path keyboard-accessible, visible focus, contrast |

---

## 15. Build plan (27 Aug → 9 Sep)

~13 days. Prize-critical order, not “architecture first”.

| Window | Outcome |
| --- | --- |
| **D0–D1** | 8004scan Pro key. Scaffold 4 Altana agents. Ponder spike (testnet + mainnet read). Faucet $U + tBNB. |
| **D2–D4** | J1 skeleton on **one** desk that **produces tx** (Yield one-shot shortest). Parallel: `sellerCore` for other three, each minimal 1 tx path. |
| **D5–D7** | All four desks equal UI depth. Live metrics wired. Grant/revoke session UI. First real `hireErc8183Agent` tx in Altana explorer. |
| **D8–D10** | Grid track record. Yield routing. Rebalance range reset. PCS-facing flow actually moves PCS state. |
| **D11–D12** | Agent Advantage Report runs (3 two-way tasks). Mainnet if possible. Public deploy (not BNB 48h trial). No dead ends. |
| **D13** | Submit: URL, wallet addresses, explorer links, report, demo script. Feature freeze. |

If time slips, **cut 8004scan and fee collection**, not a desk, not the second variant. One stub category loses Diversity. Four desks × 2 thin variants beats one deep category.

---

## 16. Acceptance checklist (ship)

### Main

- [ ] Public URL loads without feature flags.
- [ ] Four desks, each list + detail + hire + job monitor, equal depth.
- [ ] J1 cold user recorded (internal) without off-site instructions.
- [ ] Every agent registered live on BSC (ERC-8004 + reachable face).
- [ ] Dashboard: P&L + **displayed** performance fee, withdraw without deduction.
- [ ] Ponder live; listing does not hit RPC from browser for index.

### Altana

- [ ] Four Altana seller wallets (eight with aggressive variants).
- [ ] Grant session: allowlist + spend cap + expiry, registered in Keystore.
- [ ] ≥1 session-key tx in [Altana explorer](https://docs.altana.network) (testnet or mainnet).
- [ ] In-app session view + Revoke.
- [ ] Hire path uses `hireErc8183Agent`.
- [ ] Submission includes wallet address.

### TermiX

- [ ] `/report` live with 3 tasks, artifacts, one trading.
- [ ] Judges can hire without walkthrough.
- [ ] Grid (or trading) agent shows win rate, window, risk.

### PancakeSwap

- [ ] At least one flow manages PCS liquidity or executes PCS swap/grid for user under session cap.
- [ ] Benefit visible on-chain (position / fill / fee), not mock screenshot.

### Hygiene

- [ ] No Turbo marketing starter left on `/`.
- [ ] Faucet / wrong network / agent down states exist.
- [ ] No secrets in git.

---

## 17. Risks

| Risk | Mitigation |
| --- | --- |
| BNB trial / AgentCore sleep + OAuth | Host on VPS; optional 1 agent `bag deploy` as official-path demo only |
| Altana + paid B402 unsupported | ERC-8183 is paid rail; do not block on B402 |
| PCS “range” vs Altana LP v2 skill | Implement v3 range ops ourselves; skill is starting point |
| Temptation of 200k agents | Seed four live agents; optional “also on 8004scan” secondary |
| Empty marketplace day 1 | First-party agents in scope, not nice-to-have |
| Fake metrics | Missing/stale label beats dummy APR |
| TermiX report left to last night | Calendar three runs at D11; DIY baseline from D5 |
| Unknown Phase 2 | Production reliability and no dead ends is the hedge |

---

## 18. Open questions

Closed: passkey, testnet 97, VPS, 2 variants/desk, Yield Venus-only, new positions in Altana, 8183 + session, **Ponder**, mainnet = FE only, performance fee not collected.

Still open (technical, not product):

1. Canonical PCS V3 function signatures that take structs (not placeholder `(...)`).
2. Whether browser `grantSession` + `sessionSigner` persists to agent without byte-exact JSON traps.
3. Passkey on Chrome / Safari / Firefox (+ mobile QR WebAuthn fallback).
4. Tick interval per desk vs 9router quota.
5. Impact of `evaluator_type: uma_oov3` on 8183 settle.
6. Public brand (Am-M vs name that fits bnbchain.org).

---

## 19. References

- Hackathon overview: https://www.bnbchain.org/en/hackathons/smart-money-era
- Agent Studio: https://www.bnbchain.org/en/bnb-agent-studio
- Studio docs: https://docs.bnbchain.org/developer-kit/bnbchain-studio/
- Altana ERC-8183 hire: https://docs.altana.network/sdk/erc8183
- Altana skills: https://skills.altana.network
- 8004scan API: https://8004scan.io/developers
- Ponder: https://ponder.sh
- Internal brief: [`docs/Hackathon.md`](./Hackathon.md)
- Design reference (input, not source of truth): [`docs/referensiprd.md`](./referensiprd.md), [`docs/referensitechspec.md`](./referensitechspec.md)
