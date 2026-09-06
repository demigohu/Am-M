# gridtradingagg (aggressive variant)

Shares `app/agent/src` with `agents/gridtrading` via relative symlinks. Run `../../scripts/scaffold-aggressive-agents.sh` after git clone on VPS.

```bash
cd agents/gridtradingagg
cp .env.example .studio/.env.local
cd app/agent && pnpm install && pnpm build
bag wallet new
bag erc8004 register --endpoint https://gridtradingagg.ammlabs.fun/
```
