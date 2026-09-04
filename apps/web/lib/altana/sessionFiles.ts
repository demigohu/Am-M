import path from "node:path";

export const DESK_SLUGS = ["rebalance", "grid", "yield", "guard"] as const;
export type DeskSlug = (typeof DESK_SLUGS)[number];

export const ID_RE = /^[a-zA-Z0-9._-]{1,80}$/;

export function sessionsRoot(): string {
  return process.env.USER_SESSIONS_DIR?.trim() || path.join(process.cwd(), ".data", "sessions");
}

export function isDeskSlug(value: string | undefined): value is DeskSlug {
  return DESK_SLUGS.includes(value as DeskSlug);
}

export function sessionFile(id: string, desk?: DeskSlug): string {
  const root = sessionsRoot();
  if (desk) return path.join(root, desk, `${id}.json`);
  return path.join(root, `${id}.json`);
}

export function allSessionCandidates(id: string): string[] {
  const root = sessionsRoot();
  return [
    path.join(root, `${id}.json`),
    ...DESK_SLUGS.map((desk) => path.join(root, desk, `${id}.json`)),
  ];
}
