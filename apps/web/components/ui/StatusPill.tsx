import type { StatusTone } from "../../lib/catalog";

const toneClass: Record<StatusTone, string> = {
  green: "text-status-green bg-status-green/10 border-status-green/40",
  amber: "text-status-amber bg-status-amber/10 border-status-amber/40",
  char: "text-char bg-char/10 border-char/30",
};

const dotClass: Record<StatusTone, string> = {
  green: "bg-status-green",
  amber: "bg-status-amber",
  char: "bg-char",
};

export function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: StatusTone;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${toneClass[tone]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotClass[tone]}`} />
      {label}
    </span>
  );
}
