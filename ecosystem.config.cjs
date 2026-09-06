const path = require("node:path");

/** Repo root = folder that contains this file (works for /root/Am-M or /opt/am-m). */
const root = __dirname;

const DESK_BY_AGENT = {
  healthfactor: "guard",
  rebalancing: "rebalance",
  gridtrading: "grid",
  yieldrouter: "yield",
  healthfactoragg: "guard",
  rebalancingagg: "rebalance",
  gridtradingagg: "grid",
  yieldrouteragg: "yield",
};

/** @param {string} name @param {number} port @param {"conservative"|"aggressive"} [variant] */
function app(name, port, variant = "conservative") {
  const desk = DESK_BY_AGENT[name];
  return {
    name,
    cwd: path.join(root, "agents", name, "app", "agent"),
    script: "dist/unifiedMain.js",
    interpreter: "node",
    env_file: path.join(root, "agents", name, ".studio", ".env.local"),
    env: {
      AGENT_PORT: String(port),
      AGENT_BIND_HOST: "127.0.0.1",
      AGENT_VARIANT: variant,
      AMM_AGENT_ID: name,
      PUBLIC_AGENT_URL: `https://${name}.ammlabs.fun`,
      ERC8183_AGENT_URL: `https://${name}.ammlabs.fun/erc8183`,
      USER_SESSIONS_DIR: path.join(root, "data", "sessions", desk),
      AMM_DESK: desk,
      INDEXER_URL: "http://127.0.0.1:42069",
    },
    max_restarts: 20,
    restart_delay: 5000,
    time: true,
  };
}

module.exports = {
  apps: [
    app("healthfactor", 9001),
    app("rebalancing", 9002),
    app("gridtrading", 9003),
    app("yieldrouter", 9004),
    app("healthfactoragg", 9005, "aggressive"),
    app("rebalancingagg", 9006, "aggressive"),
    app("gridtradingagg", 9007, "aggressive"),
    app("yieldrouteragg", 9008, "aggressive"),
    {
      name: "indexer",
      script: "pnpm",
      args: "--filter indexer start",
      cwd: root,
      interpreter: "none",
      env_file: path.join(root, "apps/indexer/.env.local"),
      env: {
        DATABASE_SCHEMA: "ponder",
      },
      max_restarts: 20,
      restart_delay: 5000,
      time: true,
    },
  ],
};
