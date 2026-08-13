const PLATFORMS = [
  "PlayStation 5",
  "Xbox Series X|S",
  "Nintendo Switch 2",
  "Steam",
  "Epic Games",
  "GOG.com",
  "PlayStation 4",
  "Nintendo Switch",
];

/** The black "one place" band. The prototype shows platform logos here; we
 *  don't licence those marks, so the row runs as a typographic marquee. */
export function PlatformBand() {
  return (
    <section className="grain border-y border-hairline bg-void py-20">
      <div className="shell text-center">
        <h2 className="text-3xl font-light tracking-tight text-white md:text-[2.5rem]">
          All Your Games in One Place
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-[0.8125rem] leading-relaxed text-white/60">
          Explore your favorite games and see where they&apos;re available —
          whether on Steam, PlayStation, Xbox, Nintendo, or more. We gather
          platform info so you don&apos;t have to. Plan your next play without
          the guesswork.
        </p>
      </div>

      <div
        className="relative mt-14 overflow-hidden"
        // Fades the marquee into the band instead of clipping it hard.
        style={{
          maskImage:
            "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
        }}
      >
        <ul className="marquee-track flex w-max items-center gap-16 pr-16">
          {[...PLATFORMS, ...PLATFORMS].map((name, i) => (
            <li
              key={`${name}-${i}`}
              aria-hidden={i >= PLATFORMS.length}
              className="whitespace-nowrap text-xl font-light tracking-[0.15em] text-white/35 transition-colors duration-300 hover:text-white/80 md:text-2xl"
            >
              {name}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
