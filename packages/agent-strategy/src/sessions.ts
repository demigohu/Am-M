import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type { Session } from "@altananetwork/sdk";
import { deserializeSession } from "@bnbagent/sdk/wallets";

/**
 * Load user Altana sessions for strategy ticks.
 *
 * Never log the payload — it contains the session private key.
 * Sources (first match wins per entry):
 *   USER_SESSION          — one serialized session JSON string
 *   USER_SESSION_FILE     — path to one serializeSession() file
 *   USER_SESSIONS_DIR     — directory of *.json files
 */
export async function loadUserSessions(): Promise<Session[]> {
  const out: Session[] = [];
  const env = process.env.USER_SESSION;
  if (env && env.trim() !== "") {
    out.push(await deserializeSession(env));
  }
  const file = process.env.USER_SESSION_FILE;
  if (file && existsSync(file)) {
    out.push(await deserializeSession(readFileSync(file, "utf8")));
  }
  const dir = process.env.USER_SESSIONS_DIR;
  if (dir && existsSync(dir)) {
    const files = readdirSync(dir)
      .filter((name) => name.endsWith(".json"))
      .sort();
    for (const name of files) {
      const body = readFileSync(path.join(dir, name), "utf8");
      if (body.trim() === "") continue;
      out.push(await deserializeSession(body));
    }
  }
  return out;
}
