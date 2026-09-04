"use client";

import { useState } from "react";

export function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 rounded-full border border-ink bg-bone px-3 py-1 text-[11px] font-bold hover:bg-buttercream"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      }}
    >
      <span className="material-symbols-outlined text-[14px]">content_copy</span>
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
