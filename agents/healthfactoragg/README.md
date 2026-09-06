# healthfactoragg (aggressive variant)

Shares `app/agent/src` with `agents/healthfactor`. Separate wallet, `.studio/`, and pm2 process.

## Local / VPS setup

```bash
cd agents/healthfactoragg
cp .env.example .studio/.env.local   # fill WALLET_PASSWORD, indexer secrets
cd app/agent && pnpm install && pnpm build
bag wallet new                        # updates studio.toml address
bag erc8004 register --endpoint https://healthfactoragg.ammlabs.fun/
```

Then update `apps/web/lib/catalog.ts` → `healthfactoragg` entry: `wallet`, `registryId`, `endpoint`.

`AGENT_VARIANT=aggressive` is set in `ecosystem.config.cjs` (pm2 env).
