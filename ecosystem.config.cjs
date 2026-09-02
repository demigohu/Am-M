const path = require("node:path");

/** Repo root = folder that contains this file (works for /root/Am-M or /opt/am-m). */
const root = __dirname;

/** @param {string} name @param {number} port */
function app(name, port) {
  return {
    name,
    cwd: path.join(root, "agents", name, "app", "agent"),
    script: "dist/unifiedMain.js",
    interpreter: "node",
    env_file: path.join(root, "agents", name, ".studio", ".env.local"),
    env: {
      AGENT_PORT: String(port),
      AGENT_BIND_HOST: "127.0.0.1",
    },
    max_restarts: 20,
    restart_delay: 5000,
  };
}

module.exports = {
  apps: [
    app("healthfactor", 9001),
    app("rebalancing", 9002),
    app("gridtrading", 9003),
    app("yieldrouter", 9004),
  ],
};
