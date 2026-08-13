import Link from "next/link";
import { Wordmark } from "@/components/nav/Wordmark";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-hairline bg-void">
      <div className="shell flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Wordmark className="text-lg" />
          <p className="mt-2 max-w-xs text-[0.8125rem] leading-relaxed text-muted-foreground">
            Every game. Every store. One place.
          </p>
        </div>

        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-[0.8125rem]">
          <Link
            href="/privacy"
            className="text-muted-foreground transition-colors hover:text-white"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="text-muted-foreground transition-colors hover:text-white"
          >
            Terms
          </Link>
        </nav>
      </div>

      <div className="shell border-t border-hairline/60 py-5">
        <p className="text-xs text-faint">
          Game data from IGDB. Pricing from IsThereAnyDeal. Ludi is not
          affiliated with any storefront.
        </p>
      </div>
    </footer>
  );
}
