import Image from "next/image";
import Link from "next/link";
import { igdbImageUrl } from "@/lib/igdb/images";
import { Button } from "@/components/ui/button";

type Props = {
  title: string;
  body: string;
  ctaLabel: string;
  href: string;
  /** IGDB artwork/screenshot id for the right-hand art. */
  backdropImageId: string | null;
};

/** Purple panel with a diagonal edge cutting into artwork — the "Trailers, Art
 *  & More!" treatment from the prototype. */
export function PromoBanner({
  title,
  body,
  ctaLabel,
  href,
  backdropImageId,
}: Props) {
  const backdrop = igdbImageUrl(backdropImageId, "1080p");

  return (
    <section className="shell">
      <div className="group relative isolate overflow-hidden rounded-md bg-void">
        <div className="relative aspect-[16/6] min-h-[13rem] w-full">
          {backdrop && (
            <Image
              src={backdrop}
              alt=""
              fill
              sizes="(max-width: 1200px) 100vw, 1200px"
              className="object-cover object-center transition-transform duration-[1.2s] ease-out group-hover:scale-105"
            />
          )}

          {/* The purple wedge. The second stop past 100% keeps the diagonal
              off-canvas on narrow viewports so the copy never sits on art. */}
          <div
            className="absolute inset-y-0 left-0 w-full bg-brand sm:w-[62%]"
            style={{
              clipPath: "polygon(0 0, 100% 0, calc(100% - 5.5rem) 100%, 0 100%)",
            }}
          />

          <div className="relative z-10 flex h-full max-w-[56%] flex-col justify-center px-6 py-6 sm:px-10">
            <h2 className="text-2xl font-normal leading-tight text-white md:text-[1.75rem]">
              {title}
            </h2>
            <p className="mt-3 max-w-xs text-[0.8125rem] leading-relaxed text-white/80">
              {body}
            </p>
            <Button asChild variant="contrast" className="mt-5 w-fit">
              <Link href={href}>{ctaLabel}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
