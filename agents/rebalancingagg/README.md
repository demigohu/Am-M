# rebalancingagg (aggressive variant)

Shares `app/agent/src` with `agents/rebalancing` via relative symlinks. Run `../../scripts/scaffold-aggressive-agents.sh` after git clone on VPS.

```bash
cd agents/rebalancingagg
cp .env.example .studio/.env.local
cd app/agent && pnpm install && pnpm build
bag wallet new
bag erc8004 register --endpoint https://rebalancingagg.ammlabs.fun/
```
