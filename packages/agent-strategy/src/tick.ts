import type { Session } from "@altananetwork/sdk";
import type { DeskRunner } from "./desks.js";
import { loadUserSessions } from "./sessions.js";
import { jsonSafe, riskProfile, type ExecuteFn, type TickReport } from "./types.js";

export type TickLoop = {
  last: TickReport[] | { skipped: string } | { idle: string };
  running: boolean;
};

const log = {
  info: (msg: string) => console.log(`[strategy.tick] ${msg}`),
  warn: (msg: string) => console.warn(`[strategy.tick] ${msg}`),
  error: (msg: string, e?: unknown) =>
    console.error(`[strategy.tick] ${msg}`, e ?? ""),
};

export function createTickLoop(opts: {
  desk: DeskRunner;
  execute: ExecuteFn;
  intervalMs?: number;
}): { start: () => () => void; status: () => TickLoop } {
  const intervalMs =
    opts.intervalMs ??
    Number(process.env.TICK_INTERVAL_MS || 120_000);
  const state: TickLoop = { last: { idle: "not started" }, running: false };
  let locked = false;

  const tick = async (): Promise<void> => {
    if (locked) {
      log.warn("skip overlapping tick");
      state.last = { skipped: "overlap" };
      return;
    }
    locked = true;
    state.running = true;
    try {
      const sessions = await loadUserSessions();
      if (sessions.length === 0) {
        state.last = {
          idle: "no USER_SESSION / USER_SESSION_FILE / USER_SESSIONS_DIR",
        };
        log.info("tidak ada session user — tick idle (bukan agent wallet).");
        return;
      }
      const variant = riskProfile();
      const reports: TickReport[] = [];
      for (const session of sessions) {
        try {
          const report = await opts.desk({
            session,
            variant,
            execute: opts.execute,
          });
          reports.push(report);
          log.info(
            `${report.desk} ${report.wallet} ${report.action.kind} ${report.action.reason}${
              report.execution?.transactionHash
                ? ` tx=${report.execution.transactionHash}`
                : ""
            }`,
          );
        } catch (e) {
          log.error(
            `session ${session.walletAddress} gagal (lanjut session berikutnya)`,
            e,
          );
        }
      }
      state.last = jsonSafe(reports) as TickReport[];
    } catch (e) {
      log.error("tick gagal", e);
    } finally {
      locked = false;
      state.running = false;
    }
  };

  return {
    status: () => state,
    start: () => {
      log.info(`interval ${intervalMs}ms variant=${riskProfile()}`);
      void tick();
      const id = setInterval(() => {
        void tick();
      }, intervalMs);
      return () => clearInterval(id);
    },
  };
}

export async function runOnce(
  desk: DeskRunner,
  execute: ExecuteFn,
  sessions?: Session[],
): Promise<TickReport[] | { idle: string }> {
  const list = sessions ?? (await loadUserSessions());
  if (list.length === 0) {
    return { idle: "no user sessions" };
  }
  const variant = riskProfile();
  const reports: TickReport[] = [];
  for (const session of list) {
    reports.push(await desk({ session, variant, execute }));
  }
  return reports;
}
