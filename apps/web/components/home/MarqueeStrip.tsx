import { PeanutMark } from "../brand/PeanutMark";

function Track() {
  return (
    <div className="flex shrink-0 items-center gap-8">
      {Array.from({ length: 4 }).map((_, i) => (
        <span key={i} className="flex items-center gap-8">
          <span className="font-display text-[22px] font-bold tracking-wider text-ink uppercase">
            Live (testnet)
          </span>
          <PeanutMark className="h-7 w-7 shrink-0" />
        </span>
      ))}
    </div>
  );
}

export function MarqueeStrip() {
  return (
    <section className="w-full overflow-hidden border-b border-ink bg-buttercream py-3.5 select-none" id="marquee">
      <div className="animate-marquee flex w-max items-center whitespace-nowrap">
        <Track />
        <Track aria-hidden />
      </div>
    </section>
  );
}
