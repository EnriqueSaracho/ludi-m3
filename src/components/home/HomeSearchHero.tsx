"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

/** The centred pill search that sits under the "Explore Games" heading. */
export function HomeSearchHero() {
  const router = useRouter();
  const [q, setQ] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = q.trim();
    if (trimmed.length < 2) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form
      onSubmit={submit}
      role="search"
      className="group relative mx-auto w-full max-w-sm"
    >
      <label htmlFor="home-search" className="sr-only">
        Search games
      </label>
      <input
        id="home-search"
        type="search"
        placeholder="Search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="h-11 w-full rounded-full border border-hairline-strong bg-void pl-5 pr-12 text-sm text-foreground transition-all duration-300 placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/40 [&::-webkit-search-cancel-button]:appearance-none"
      />
      <button
        type="submit"
        aria-label="Search"
        className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-brand hover:text-white"
      >
        <Search className="h-4 w-4" strokeWidth={1.5} />
      </button>
    </form>
  );
}
