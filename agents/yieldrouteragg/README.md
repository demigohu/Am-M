# yieldrouteragg (aggressive variant)

Shares `app/agent/src` with `agents/yieldrouter`. Separate wallet, `.studio/`, and pm2 process.

## Local / VPS setup

```bash
cd agents/yieldrouteragg
cp .env.example .studio/.env.local   # fill WALLET_PASSWORD, indexer secrets
cd app/agent && pnpm install && pnpm build
bag wallet new                        # updates studio.toml address
bag erc8004 register --endpoint https://yieldrouteragg.ammlabs.fun/
```

Then update `apps/web/lib/catalog.ts` → `yieldrouteragg` entry: `wallet`, `registryId`, `endpoint`.

`AGENT_VARIANT=aggressive` is set in `ecosystem.config.cjs` (pm2 env).
