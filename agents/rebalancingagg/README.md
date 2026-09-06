# rebalancingagg (aggressive variant)

Shares `app/agent/src` with `agents/rebalancing`. Separate wallet, `.studio/`, and pm2 process.

## Local / VPS setup

```bash
cd agents/rebalancingagg
cp .env.example .studio/.env.local   # fill WALLET_PASSWORD, indexer secrets
cd app/agent && pnpm install && pnpm build
bag wallet new                        # updates studio.toml address
bag erc8004 register --endpoint https://rebalancingagg.ammlabs.fun/
```

Then update `apps/web/lib/catalog.ts` → `rebalancingagg` entry: `wallet`, `registryId`, `endpoint`.

`AGENT_VARIANT=aggressive` is set in `ecosystem.config.cjs` (pm2 env).
