import type { CSSProperties } from "react";

export function Icon({
  name,
  className = "text-[18px]",
  style,
}: {
  name: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span className={`material-symbols-outlined ${className}`} style={style} aria-hidden>
      {name}
    </span>
  );
}
