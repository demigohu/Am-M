# yieldrouteragg (aggressive variant)

Shares `app/agent/src` with `agents/yieldrouter` via relative symlinks. Run `../../scripts/scaffold-aggressive-agents.sh` after git clone on VPS.

```bash
cd agents/yieldrouteragg
cp .env.example .studio/.env.local
cd app/agent && pnpm install && pnpm build
bag wallet new
bag erc8004 register --endpoint https://yieldrouteragg.ammlabs.fun/
```
