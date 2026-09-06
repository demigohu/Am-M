# The Smart Money Era: BNB Agent Studio Hackathon

## Overview

The Smart Money Era is here, where knowing the right people no longer gates access to financial opportunities. Keep up with the next generation of finance by having the right agents available on-demand to service any market 24/7.

Finding agents on BNB Chain today is harder than it should be, we want you to help us make opportunities more discoverable and accessible to all by building the marketplace for BNB Chain’s AI agents, the new home for smart money.

## Prizes & Bounties

### Main Track Prize

- 🥇 **Winner:** $30,000 equivalent, plus official adoption as the BNB Agent Studio marketplace, the canonical front door for every agent on BSC.

### Partner Bounties

Partner bounties are judged independently by each partner, on their own criteria.

#### Best Built with Altana

- 🏆 **50,000 Altana XP.** Winner takes all, awarded to one team. (Allocation mechanics to be confirmed.)
- To be considered for the prize, your submission must show live onchain transactions in the Altana explorer, on testnet or mainnet. See the Tracks tab for the full qualification criteria, and make sure to include your wallet address(es) in your submission.

#### TermiX Challenge

- 🥇 **1st Place:** $6,000
- 🥈 **2nd Place:** $3,000
- 🥉 **3rd Place:** $1,000
- _Judged independently by TermiX on its own criteria (see the Tracks tab). Submissions must include the required Agent Advantage Report to be eligible._

#### PancakeSwap Challenge

- 🏆 **1,000 CAKE** for the best submission delivering a real benefit to PancakeSwap traders or liquidity providers (see the Tracks tab for the challenge details).

---

## Tracks

### Main Track: Build the BNB Agent Studio Marketplace

Build the best agent marketplace for BNB Chain. Somewhere, users need to find agents, understand what they do, and hire them in a few clicks. Right now that place doesn't exist. So: build it.

The top submission gets officially adopted as the BNB Agent Studio marketplace, the canonical front door for every agent on BSC. This isn't a demo day. Whatever you ship here is what real users interact with next.

#### What You're Building

A front end that surfaces agent data, lets users discover and activate agents by category, and doesn't make them think too hard about it.
Four categories, all first-class:

- **Rebalancing:** Manages LP ranges, resets positions automatically
- **Grid Trading:** Places and manages automated grid orders
- **Yield Optimisation:** Routes liquidity to the highest available APR
- **Health Factor Monitoring:** Protects lending positions from liquidation

_Note: Single-category submissions score poorly. All four, equally deep, is the bar._

#### How You're Judged

Three judges, scored independently, then compared.

- **Functionality:** The full journey works end to end: land, find an agent by category, understand what it does, activate it, with minimal friction. Someone with zero Agent Studio knowledge should be able to get through it without hitting a dead end.
- **Data Quality:** Real-time, accurate data that goes beyond basic counts. A user should be able to look at what you're showing and make a genuinely informed call on which agent to hire.
- **Agent Diversity:** All four categories (rebalancing, grid trading, yield, health factor) surfaced with equal depth. A submission that treats one category as the main event and the rest as an afterthought won't score well here.

_(We'll also assess more criterias in the second phase, stay tuned to find out!)_

#### Timeline

- **Build:** NOW!
- **Shortlist:** Submissions close and the top 3 are shortlisted publicly.
- **Phase 2:** [REDACTED]
- **Winner announced**

#### Tooling

Describe it, and Cursor scaffolds it against the BNB Agent Studio CLI. No blockchain experience required to get from idea to deployed agent. Agent Studio runs on AWS underneath; that's just how it works, not a separate track to build for.

#### Eligibility

- Open globally, to individuals or teams.
- One entry per team.
- Your submission must be functional and publicly accessible during judging.
- Agents surfaced on your marketplace must be live on BSC.

### Partner Track: Best Built with Altana

Altana is self-custodial infrastructure for sovereign agents. An agent holds its own wallet and its own key: no custodian, no shared treasury, no human signing every transaction. The owner grants a scoped session (which calls the agent may make, how much it may spend, when the permission expires), and grant and revoke stay with the owner. Every session key is registered in a public onchain registry, so any app or agent can check which keys hold authority on a wallet and when that authority expires. Revocation is one transaction and takes effect immediately.

The track: build an agent marketplace on BNB Chain where the agents transact for themselves, inside limits their users set.

#### What Separates a Winner from a Participant

To be considered for the prize, your submission must show live onchain transactions in the Altana explorer (testnet or mainnet).

- Agents on their own Altana wallets.
- Sessions with real limits: call allowlist, spend cap, expiry.
- Sessions registered in Keystore, so integration is read onchain rather than from the pitch.
- Real onchain transactions through a session key. Testnet counts, mainnet is stronger.
- User-facing control: a user can see what their agent may do, and revoke it, inside the product.

**Bonus:**

- Hire BNB Agent Studio agents through ERC-8183 using the Altana ERC-8183 SDK. Altana ships both the buyer side and the seller side.
- Implement sell over x402/B402 using the x402 server SDK.

#### Ideas to Build

| Build                        | The agent does                                                        | Altana piece                                           |
| :--------------------------- | :-------------------------------------------------------------------- | :----------------------------------------------------- |
| **Agent hiring marketplace** | Hires and pays other agents, escrow handled                           | ERC-8183 buyer side, hireErc8183Agent                  |
| **Agent-to-agent commerce**  | Buys inference or data per call, neither side holds the other's keys  | b402 payments, `@altananetwork/x402-server`            |
| **Autonomous DeFi**          | Rebalances, lends, stakes, copy-trades inside a cap it cannot exceed  | Spend caps plus Aave, Venus, PancakeSwap, Lista skills |
| **Micro-payment streaming**  | Pays per call, per second, per unit, with no human approving each one | Session key with expiry, b402                          |
| **Treasury or payroll**      | Runs recurring payments and subscriptions on a schedule               | Multiple agents on one wallet, different scopes        |

### Partner Track: TermiX Challenge

What TermiX is judging, in one line: does hiring an agent on this marketplace actually beat doing the job yourself, and can you prove it with numbers?
You are not asked to integrate anything with TermiX. The submission is the marketplace itself, judged on whether the agents on it are genuinely worth paying for. TermiX will hire from your marketplace themselves and see what comes back.

#### How You're Judged

TermiX scores independently of the main track rubric.

- **Value of the services (30%):** Real working agents at a price and speed that beat the alternative. TermiX will hire from your marketplace and evaluate the results.
- **Proven agent advantage (30%):** Measured, not asserted, backed by the required Agent Advantage Report.
- **High-stakes categories & track record (20%):** Trading, stock/equities and security agents weighted above general-purpose. Trading agents need a real record: win rate, the window, and the risk taken to get there.
- **Marketplace quality (20%):** Find, compare, hire, without instructions.

#### Required: Agent Advantage Report

Your submission must include an Agent Advantage Report:

1. At least 3 real tasks run both ways: with an agent hired through your marketplace vs. without.
2. For each task, report time, cost and output quality, with the actual outputs attached.
3. At least one task must come from trading, stock or security.

_The "Proven agent advantage" criterion (30%) is scored against this report, so plan for it from day one._

### Partner Challenge: PancakeSwap

Your agent must deliver a real benefit to PancakeSwap traders or liquidity providers. For example: smarter liquidity management, finding better yields, researching market movements to find demand where creating PancakeSwap pools could improve liquidity efficiency, or executing safe automated swaps using PancakeSwap products without ever putting user funds at risk.

---

## Resources

### BNB Chain & Agent Studio

- **BNB Agent Studio:** ship an AI agent that runs itself. Describe it, and Cursor scaffolds it against the BNB Agent Studio CLI. No blockchain experience required to get from idea to deployed agent.
- **BNB Agent Studio launch overview:** how Agent Studio works and what you can build with it.
- **BSC Testnet Faucet:** get testnet BNB for development and testing.

### Altana

- **Quickstart:** build an agent marketplace on BNB with Altana.
- **Live workshop:** hands-on session during the build period (date TBC).
- **Office hours:** available throughout the build period.
- **Ten production skills to compose, at skills.altana.network:** Aave V3 Lending, Copy Trade, Four.meme Trading, Lista Liquid Staking, PancakeSwap Liquidity, PancakeSwap Trading, Token Radar, Venus Lending, Wallet Tracker, x402 API Payments.
- **Links:** Altana docs, SDK and MCP server, Sessions, ERC-8183 SDK, x402 server SDK, Testnet faucet.

### 8004scan (by AltLayer)

8004scan is the home for ERC-8004 agents and a discovery and trust layer for the onchain agent economy. It helps builders discover agents, verify their identities, evaluate reputation signals, and track activity across multiple blockchain networks. BNB Chain is the largest ERC-8004 ecosystem tracked by 8004scan, with more than 200,000 registered agents.

Through the 8004scan developer API, you can access structured agent identity, capability, ownership, reputation, feedback, and network data to build agent marketplaces, discovery and recommendation tools, reputation systems, analytics dashboards, and agent-to-agent applications.

**Free Pro-tier access for hackathon participants:** eligible participants receive complimentary access to the 8004scan Pro API tier for the duration of the hackathon.

- Up to 500 API requests per minute
- Up to 100,000 requests per day
- To apply, create an API key through the 8004scan Developer Hub and submit your details through the Pro-Tier Upgrade Form.
- **Links:** 8004scan, 8004scan Developer Hub and API, Pro-Tier Upgrade Form, 8004scan Ecosystem Report, Explore BNB Chain agents.

### TermiX

- **TermiX:** the marketplace where AI agents hire agents.
- **BSC MCP server:** TermiX's open-source MCP server for interacting with BNB Chain.

### PancakeSwap

- PancakeSwap Developer Portal
- PancakeSwap Documentation

---

## Article

### Build the Era: Build the Official BNB Agent Studio Marketplace

_2026.8.5 • 4 min read_

## TL;DR

- Build the Era is an open hackathon to build the best AI agent marketplace on BNB Smart Chain.
- The winner has the chance to become the officially adopted BNB Agent Studio marketplace, as a standalone product.
- $40,000+ in prizes from BNB Chain and ecosystem partners on top, plus token and credit rewards.
- Open to solo builders and teams.
- Submissions run Aug 5 – Sep 9. [Register here](#).

## Agents are landing on BNB Chain faster than anyone can find them

More than 200,000 AI agents are registered on BNB Smart Chain under ERC-8004, the standard for onchain agent identity, roughly 60% of all registered agents across 26 networks (BNB Chain AI Agent Landscape, July 2026). But there's no good way to find them: hiring one today means digging through X threads and GitHub repos, with no way to compare what an agent does, whether it's live, or how it has performed. That's a discoverability problem, and it caps the category. Every agent on BSC is only as useful as someone's ability to find and hire it.

Build the Era is a hackathon to fix that, and the start of the Smart Money Era. Smart money used to mean knowing the right people; now it means having the right agents. For that to hold on BSC, someone has to build the place where agents get discovered, compared, and hired. That's the challenge, and the winning build earns the chance to become the officially adopted BNB Agent Studio marketplace.

## The Challenge

Build the best AI agent marketplace on BNB Smart Chain: one venue to browse agents, see what they do and how they've performed, and put them to work. We're asking for the marketplace itself, not a portfolio of agents, and the measure that matters most is how easily someone can find an agent and hire it.

You're not starting from zero. Agents registered under ERC-8004 already carry an onchain identity and a track record other software can look up; your job is to make that legible to a person deciding who to hire. The main challenge is open, with no fixed tracks; three partner tracks with their own prizes and criteria run alongside it (see Partner Tracks below), with Binance x402 used as the payment facilitator in BNB Agent Studio. No marketplace on BNB Chain today looks like what we're after, so there's room to get creative.

## What Winning Means

The winning marketplace is in line to become the officially adopted community marketplace for BNB Agent Studio. Adoption means we back it as a standalone product with its own brand and team, and incubate it as the discoverability layer for agents on BSC. It's something we intend to keep alive, drive users to, and grow with the ecosystem.

For a solo builder or a small team, the prize is a product: real users routed to what you built, and BNB Chain's backing to keep building it. Winning is also additive: taking first place doesn't rule you out of partner track prizes, and one build can win both.

## Ideas for What to List

A marketplace works when it has coverage. To give you a sense of what we expect agents on BSC to look like, we'll share reference agents and skills from our partners to build against, spanning four categories:

- **Monitoring agents**: watching markets, wallets, and positions
- **Grid trading agents**: running automated strategies within set ranges
- **Health factor agents**: tracking loan positions and acting before liquidation
- **Yield agents**: moving capital to where it earns most

Treat these as guidance, not a definitive list or judging criteria. They're there to show the range a marketplace should be able to handle; if yours supports these four well, it can handle what comes next.

## Prizes

Whilst adoption is the headline prize, the prize pool sweetens it:

| Partner     | Prize                                               |
| ----------- | --------------------------------------------------- |
| BNB Chain   | $30,000 USDT                                        |
| TermiX      | $10,000 USDT                                        |
| PancakeSwap | 1,000 CAKE                                          |
| AltLayer    | 8004scan Pro plans and AltLLM credits [amounts TBC] |
| Altana      | 50,000 XP                                           |

## Partner Tracks

Three partner tracks run alongside the main challenge, each with its own prize and judging. You enter through the same intake form and tick the tracks you want; entering a track doesn't affect your main score.

### TermiX: $10,000 USDT Total Prize

TermiX judges on one question: does hiring an agent on your marketplace beat doing the job yourself, and can you prove it? Submissions include an Agent Advantage Report comparing at least three real tasks run with and without an agent, and depth in trading, equities, and security categories is weighted highest. Check out the full criteria and resources on the main hackathon page.

### Altana: 50,000 XP

Best Built with Altana rewards a marketplace where agents transact for themselves inside limits their users set: agents on their own Altana wallets, sessions with real spend caps and expiries registered onchain, and revocation the user can see in the product. Judging reads live onchain transactions in the Altana explorer; testnet counts, mainnet is stronger. Requirements, SDK, and ten production skills via the main hackathon page.

### PancakeSwap: 1,000 CAKE

Agents on your marketplace must deliver a real benefit to PancakeSwap traders or liquidity providers: smarter liquidity management, finding better yields, research that spots demand where new PancakeSwap pools could improve liquidity efficiency, or safe automated swaps using PancakeSwap products without ever putting user funds at risk. Full details can be found via the main hackathon page.

## Judging

Submissions are scored against published criteria covering functionality, data quality, and agent diversity. The full scoring rubric, reference agents, and submission requirements will be available here.

Partner tracks run on their own judging criteria, set by each sponsor. If you're entering a partner track, check that track's page via the hackathon page separately for what it's scored on.

The full scoring rubric, reference agents, and submission requirements will be available at the here when the build period opens.

## How to Enter

Build the Era is open to solo builders and teams, and both are encouraged. If your team already runs agents on BSC, this is a chance to build the venue your own products would benefit from.

Submit your build through the intake form here before the build period closes on Sep 9.

## Key Dates

- **Build period**: Aug 5 – Sep 9
- **Judging**: Sep 9 – Sep 23
- **Winner announcement**: Nov 5

## Smart Money, Built by You

The Smart Money Era is BNB Chain's push to make autonomous agents something anyone on BSC can find, hire, and put to work, and it starts with the venue. Check the reference agents, read the scoring criteria, and submit before Sep 9.
