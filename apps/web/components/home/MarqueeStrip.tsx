import Image from "next/image";

function Track() {
  return (
    <div className="flex shrink-0 items-center gap-8">
      {Array.from({ length: 4 }).map((_, i) => (
        <span key={i} className="flex items-center gap-8">
          <span className="font-display text-[22px] font-bold tracking-wider text-ink uppercase">
            Live (testnet)
          </span>
          <Image
            src="/brand/peanut-logo.svg"
            alt=""
            width={25}
            height={32}
            className="h-8 w-auto shrink-0 object-contain"
            aria-hidden
          />
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
