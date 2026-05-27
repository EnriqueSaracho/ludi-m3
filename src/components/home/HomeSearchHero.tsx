"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
    <section className="rounded-xl bg-gradient-to-b from-muted/50 to-background px-6 py-12 text-center">
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
        Every game. Every store. One place.
      </h1>
      <p className="mx-auto mt-3 max-w-md text-muted-foreground">
        Metadata, prices, and your personal library — aggregated for you.
      </p>
      <form
        onSubmit={submit}
        className="mx-auto mt-8 flex max-w-md gap-2"
        role="search"
      >
        <Input
          type="search"
          placeholder="Search games…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="flex-1"
          aria-label="Search games"
        />
        <Button type="submit">Search</Button>
      </form>
    </section>
  );
}
