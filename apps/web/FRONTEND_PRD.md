# Am-M — Frontend PRD

**Derived from:** `docs/PRD.md`, focused on `apps/web`.  
**IA status:** final — decisions below are locked; no more A/B options.  
**Purpose:** answer three questions for anyone building FE — which pages exist, which features/components on each page, and the user step order that must hold. The main PRD remains source of truth for product/protocol; this document narrows to the user-visible layer.

---

## 0. IA decisions (final)

| Decision | Outcome |
| -------- | ------- |
| Home | Pure landing — explain the project. No live agent data. |
| `/market` | Exists, separate from Home. Browse ALL agents across 4 desks. |
| `/desks/[slug]` | Exists, separate from `/market`. Deep compare within ONE desk. |
| Navbar | **One** consistent navbar on all pages. No separate Site vs App shell. |
| Word "Browse" | Removed. Nav uses plain **Market** link, not a dropdown. |
| Marigold in nav | Removed from nav entirely. Primary CTA lives in page content, not nav. |
| `/desks/[slug]` vs `/desks/*` | `[slug]` is a real Next.js dynamic route (`/desks/rebalance`, `/desks/grid`, etc.). `/desks/*` is loose notation, not a second technical option. |

**Why both Market AND Desk are needed, not one or the other:** different information density, different jobs-to-be-done.

- `/market` = quick scan across all 4 desks. Because it shows 8 agents from 4 job types in one table, metric columns must be generalized (one generic “live metric” per row) to stay readable.
- `/desks/[slug]` = once the user focuses on one job, they need ALL desk-specific metric columns (full, not generalized) plus required sort to compare 2 variants in detail. Forcing that into Market as a filter state sacrifices one of those needs.

---

## 1. Navbar — one spec for all pages

```
[Logo → /]  ·····  Market   Report  ·····  [Account]
```

- Logo always returns to Home (`/`), not Market.
- Two nav links: **Market**, **Report** — plain text, not dropdown, not “Browse”.
- **Account** — chip/button with truncated wallet address + active agent count when signed in; plain “Account” when not.
- **No Marigold button in this nav on any page.** Marigold is only the in-content primary CTA (e.g. hero button to `/market`, or Hire on a listing row).
- Footer: brand lockup (icon + wordmark, same as nav) + secondary links (Report, 8004scan, BscScan testnet).

This is the only navbar to build — no second version for Home/Report.

---

## 2. Page map (IA)

```
/                    Home — landing, project story, CTA into /market
/market              Browse all agents across 4 desks, desk filter chips
/desks/[slug]        Compare within 1 desk (rebalance|grid|yield|guard), full metrics + sort
/agents/[id]         Agent profile — proof + Hire CTA
/account             Hub: create account, fund, balance, active agents, revoke, withdraw
/hire/[id]           Checkout — permission preview + grant + pay $U
/jobs/[jobId]        ERC-8183 job status + deliverable
/report              Agent Advantage Report (TermiX proof)
```

`/sessions` is not a route — session control lives under `/account`.

---

## 3. Principles governing all FE decisions

1. **First screen = jobs, not protocol names.** Do not say “ERC-8004” or “session key” before the user understands “keep my LP in range”, etc.
2. **Dense, honest data.** Tables and live numbers, not empty hero. “Not measured yet” beats fake zeros.
3. **Every onchain fact has an explorer link.** BscScan, 8004scan, Altana explorer.
4. **Every fallible CTA has recovery.** Faucet, retry, “agent offline — pick another” — no dead ends.
5. **`/account` is a hub, not a modal.** No “Connect MetaMask” as the primary pattern.
6. **`/hire/[id]` is checkout only.** Permission preview + first action + grant. No account/funds → redirect `/account?next=/hire/[id]`, not a popup.
7. **Desktop first (1280px); mobile must be readable** — not the design target, but must not break.

---

## 4. Page-by-page — features & function

### 4.1 `/` — Home

**Goal:** a cold user (zero Agent Studio knowledge) understands in seconds what this product is and is nudged into `/market`.

**Features/components:**

- Headline stating what Am-M is and the four jobs (Rebalance/Grid/Yield/Guard) in human language.
- One primary CTA (Marigold): go to `/market`.
- Optional compact job index (4 desk stamps/cards) as visual pointer — not a live data table; clicks may go to `/desks/[slug]` if the user already knows the desk.
- Light trust strip (explorer links, ERC-8004, etc.) — credibility, not interactive hire.
- **No Hire CTA on this page** — hire lives at agent level.

**Data:** static/marketing only — no live API dependency.

**States:** no significant loading/error; page does not depend on external APIs.

### 4.2 `/market` — Browse / discovery

**Goal:** user sees all hireable agents across 4 desks and quickly finds what fits (main entry after Home).

**Features/components:**

- Desk filter chips (Rebalance / Grid / Yield / Guard) — filter in-page, not navigation away.
- Inventory table/list — target 8 rows (4 desks × 2 variants): desk mark, agent name + variant tag, **one** generic live metric, $U price, status dot, reputation, Hire button (or “Not listed”).
- “As of {time}” timestamp under table.
- Separate 8004scan strip, clearly **not hireable here**.
- Row click → `/agents/[id]`.

**States:** row skeletons while loading; honest empty state; stale data labeled with “as of {time}”.

### 4.3 `/desks/[slug]` — Desk compare

**Goal:** user focused on one job compares variants deeply (J2 — Data Quality).

**Features/components:**

- Desk header: name, job description, execution protocol + link.
- Agent list **for this desk only** (2 variants: conservative/aggressive).
- **Required sort** by desk-relevant metrics (APR, HF headroom, % in-range, win rate, $U price, reputation).
- Variant filter.
- **Full** desk-specific live metric columns (see §5).
- Row click → `/agents/[id]`.

Reachable from: `/market` chips, `/agents/[id]` breadcrumb, or Home job index.

**States:** same as `/market`.

### 4.4 `/agents/[id]` — Agent profile

**Goal:** user hires confidently because they know exactly what the agent will execute.

**Features/components:**

- What the agent **executes** (human language, not only contract function list).
- Allowlist — contract functions this session may call.
- $U price + SLA.
- Reputation + recent feedback (8004scan).
- Last tx / endpoint health.
- Track record (jobs completed, dispute rate).
- Desk-specific live fields (§5).
- **Hire** CTA → no account/funds → redirect `/account?next=/hire/[id]` (not popup/modal).

**States:** agent offline → disabled Hire + clear message + “pick another in this desk”. 8004scan fetch fail → last-good cache + banner.

### 4.5 `/account` — Account hub

**Goal:** one place for identity and funds. Replaces “Connect Wallet” — full page, not a small modal.

**Three states, one route:**

| State | Shown | Primary CTA |
| ----- | ----- | ----------- |
| **No account** | Short explanation + one CTA | “Create account” → `createPasskeyWallet` (Face ID) |
| **Account, unfunded** | Wallet address, copy, QR, faucet links, polling “waiting for funds” | Copy address / open faucet |
| **Ready** | Balances, protocol approvals, **active agents** (allowlist summary, remaining cap, expiry, Revoke per agent), displayed P&L, Withdraw | Revoke / Withdraw |

**Important:**

- From `?next=/hire/[id]` → when required state is ready, auto-return to hire page.
- Near-expiry sessions: visual warning distinct from normal status.
- Account recovery here, not a separate login form.

**States:** funding poll stuck → tell user, no infinite spinner. Revoke fail → show error, do not fake success before onchain confirm.

### 4.6 `/hire/[id]` — Checkout

**Goal:** user grants session + pays $U understanding exactly what they allow. Not create account or fund here.

**Features/components:**

- Permission preview: allowlist, spend cap, expiry — read-only.
- First-action preview — **required** before grant button enables.
- $U price.
- Protocol approval status (first time).
- One primary CTA: grant session + pay, one user-facing action.

**Gate:** no account/funds → redirect `/account?next=/hire/[id]`, not empty form.

**States:** grant fail → clear message + retry. Price/status changes while on page → refresh, do not let user pay for invalid state.

### 4.7 `/jobs/[jobId]` — Job status

**Features/components:**

- Job status: FUNDED → SUBMITTED (8183 lifecycle).
- Deliverable link + hash verification against onchain manifest.
- Tx hash with explorer link.

**States:** not indexed → “not indexed yet” + link to `/account`. Failed job → show honestly.

### 4.8 `/report` — Agent Advantage Report

**Features/components:**

- Minimum 3 tasks, side by side: Without agent (DIY) vs With agent (Am-M) — time, cost/price, output artifact.
- Tx hash, jobId, deliverable URL per task.
- At least one trading task (grid) required.

**States:** no data yet → “not measured yet” per cell, not placeholder numbers.

---

## 5. Live data fields per desk (used on `/desks/[slug]` and `/agents/[id]`)

| Desk | Required live fields |
| ---- | -------------------- |
| **Rebalance** | In-range vs out-of-range, current tick vs range, 24h fee estimate, last rebalance age, simple IL vs HODL |
| **Grid** | Pair, grid bounds, filled bid/ask, realized PnL (window), max drawdown, win rate |
| **Yield** | Venus vToken APR testnet (execution); Lista/Aave/PCS mainnet APR as **labeled context** only |
| **Guard** | Current health factor, liquidation price, buffer to liq, last action hash, estimated time to liq |

Shared per agent: name/description/image, chain+tokenId+owner, reputation+feedback, $U price+SLA, last-seen/endpoint health, jobs completed+dispute rate, wallet+Keystore session.

Refresh: ~15–60s on open agent page, ~60–120s on list pages. Always show “as of {time}”.

---

## 6. User flows — FE-only view

### J1 — Cold hire (golden path)

```
/  (read what Am-M is, click CTA to market)
  → /market  (scan desks, optional chip filter)
    → /desks/[slug]  (optional — deeper compare in one desk)
      → /agents/[id]  (read execution, allowlist, price, reputation)
        → click Hire
          ├─ no account/funds → /account?next=/hire/[id]
          │     → create account (passkey) → fund wallet.address → auto return
          └─ has account+funds → /hire/[id]
                → approve protocol (first time)
                → review allowlist + first action
                → grant session + pay $U (combined action)
                  → /jobs/[jobId]  (FUNDED→SUBMITTED, tx hash)
```

Success: someone with zero Agent Studio knowledge completes this without leaving the site.

### J2 — Compare then hire

Happens on `/desks/[slug]`: user sorts by job-relevant metrics before opening an agent.

### J3 — Kill switch

```
/account (Ready state)
  → active agents list → Revoke → confirm (passkey)
  → agent status revoked, cap no longer usable
```

### J4 — Hire without a human (TermiX / other agents)

Same path as J1 (`/market` or `/desks/[slug]` → `/agents/[id]` → `/hire/[id]`), documented/predictable enough for an external buyer agent.

---

## 7. What FE does NOT own

- Agent-side signing/execution (`ALTANA_SESSION`, tick loop) — entirely in `agents/*`; FE reads results via indexer.
- Direct RPC indexing from browser — all live data from `apps/indexer` (Ponder) API.
- Auto-settle jobs — buyer decision, not FE automation.
- Custody/custom vault — out of product scope.

---

## 8. Session delivery to agents (for FE implementers)

After grant in browser:

1. `apps/web` POST `/api/sessions` with encrypted envelope + `agentId` + `desk`.
2. Next forwards to indexer `POST /v1/sessions` (see `apps/web/lib/altana/ingest.ts`).
3. Agent processes poll `GET /v1/sessions?desk=` each tick — FE does not push to agents directly.

If indexer POST fails, show retry; do not mark hire complete until session is persisted.
