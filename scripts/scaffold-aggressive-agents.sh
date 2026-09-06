#!/usr/bin/env bash
# Aggressive workspaces share conservative app/agent source via RELATIVE symlinks
# (absolute paths break after git clone on VPS).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

declare -a BASES=(healthfactor rebalancing gridtrading yieldrouter)
declare -a AGGS=(healthfactoragg rebalancingagg gridtradingagg yieldrouteragg)
declare -a PORTS=(9005 9006 9007 9008)
declare -a NAMES=(
  "healthfactor-agent-aggressive"
  "rebalancing-agent-aggressive"
  "gridtrading-agent-aggressive"
  "yieldrouter-agent-aggressive"
)

link_rel() {
  local target="$1"
  local linkpath="$2"
  local rel
  rel="$(python3 -c "import os; print(os.path.relpath('$target', os.path.dirname('$linkpath')))")"
  if [[ -e "$linkpath" || -L "$linkpath" ]]; then
    rm -rf "$linkpath"
  fi
  ln -s "$rel" "$linkpath"
}

for i in "${!BASES[@]}"; do
  base="${BASES[$i]}"
  agg="${AGGS[$i]}"
  port="${PORTS[$i]}"
  name="${NAMES[$i]}"
  base_agent="$ROOT/agents/$base/app/agent"
  agg_dir="$ROOT/agents/$agg"
  agg_agent="$agg_dir/app/agent"

  if [[ ! -d "$base_agent/src" ]]; then
    echo "missing base agent: $base_agent" >&2
    exit 1
  fi

  mkdir -p "$agg_agent"

  for item in src scripts package.json pnpm-lock.yaml tsconfig.json vendor README.md; do
    link_rel "$base_agent/$item" "$agg_agent/$item"
  done

  cat >"$agg_agent/studio.toml" <<EOF
[project]
name = "$name"

[stack]
runtime = "agentcore"
protocols = ["A2A"]

[network]
default = "bsc-testnet"

[wallet]
kind = "altana"
keystore_dir = "../../.studio/wallets"
session_file = "../../.studio/wallets/altana-session.json"
# Run \`bag wallet new\` in agents/$agg — then update wallet + registryId in apps/web/lib/catalog.ts
address = "0x0000000000000000000000000000000000000000"

[llm]
provider = "openai"
model = "kr/claude-sonnet-4.5"
base_url = "http://127.0.0.1:20128/v1"

[payments.erc8183]
currency = "0xc70B8741B8B07A6d61E54fd4B20f22Fa648E5565"
price = "100000000000000000"
min_price = "0"
max_price = ""
quote_ttl_seconds = 900
default_estimated_completion_seconds = 600
poll_interval_seconds = 30
auto_settle = false

[storage]
kind = "local"

[budget]
enabled = false
acknowledged_at = "2026-08-29T12:34:54Z"
max_per_topup_usd = 1.0
max_per_day_usd = 3.0
max_per_month_usd = 15.0

[identity]
endpoint = "https://${agg}.ammlabs.fun/"
agent_id = 0
EOF

  cat >"$agg_dir/.env.example" <<EOF
# Copy to .studio/.env.local — chmod 600 .studio/.env.local
WALLET_PASSWORD=
NINEROUTER_API_KEY=
NINEROUTER_BASE_URL=
OPENAI_API_KEY=
AGENT_PORT=$port
AGENT_VARIANT=aggressive
INDEXER_SECRET=
SESSION_KEY_ENCRYPTION_KEY=
EOF

  cat >"$agg_dir/.gitignore" <<'EOF'
.studio/
agentcore/.env.local
node_modules/
dist/
.pnpm-store/
.DS_Store
EOF

  cat >"$agg_dir/package.json" <<EOF
{
  "name": "${agg}-workspace",
  "private": true,
  "packageManager": "pnpm@10.24.0"
}
EOF

  cp "$ROOT/agents/$base/pnpm-workspace.yaml" "$agg_dir/pnpm-workspace.yaml"

  cat >"$agg_dir/README.md" <<EOF
# ${agg} (aggressive variant)

Shares \`app/agent/src\` with \`agents/${base}\` via relative symlinks. Run \`../../scripts/scaffold-aggressive-agents.sh\` after git clone on VPS.

\`\`\`bash
cd agents/${agg}
cp .env.example .studio/.env.local
cd app/agent && pnpm install && pnpm build
bag wallet new
bag erc8004 register --endpoint https://${agg}.ammlabs.fun/
\`\`\`
EOF

  echo "scaffolded agents/$agg (port $port, links -> $base)"
done

echo "Done. Verify: ls -la agents/healthfactoragg/app/agent/package.json"
