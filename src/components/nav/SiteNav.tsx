"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Search, User, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { signOutAction } from "@/lib/lists/actions";
import { Wordmark } from "@/components/nav/Wordmark";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Profile = { username: string; avatar_url: string | null };

export function SiteNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (pathname === "/search") {
      const q = searchParams.get("q") ?? "";
      setQuery(q);
      if (q) setSearchOpen(true);
    }
  }, [pathname, searchParams]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", user.id)
        .single();
      setProfile(data ?? { username: "User", avatar_url: null });
      setLoading(false);
    });
  }, [pathname]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q.length < 2) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  function openSearch() {
    setSearchOpen(true);
    // Wait for the field to mount before focusing it.
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  const next = encodeURIComponent(pathname);

  return (
    <header className="sticky top-0 z-50 border-b border-hairline bg-elevated/85 backdrop-blur-xl">
      <div className="mx-auto flex h-14 w-full max-w-[90rem] items-center gap-3 px-6">
        <Link
          href="/"
          className="shrink-0 rounded-sm transition-opacity hover:opacity-80"
          aria-label="Ludi — home"
        >
          <Wordmark />
        </Link>

        <form
          role="search"
          onSubmit={handleSearch}
          className="flex min-w-0 flex-1 items-center gap-2"
        >
          <label htmlFor="nav-search" className="sr-only">
            Search games
          </label>
          {searchOpen ? (
            <motion.div
              initial={{ width: 40, opacity: 0 }}
              animate={{ width: "100%", opacity: 1 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="relative max-w-sm"
            >
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                strokeWidth={1.5}
                aria-hidden
              />
              <input
                id="nav-search"
                ref={inputRef}
                type="search"
                placeholder="Search games…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onBlur={() => {
                  if (!query) setSearchOpen(false);
                }}
                className="h-9 w-full rounded-full border border-hairline-strong bg-void pl-9 pr-9 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand [&::-webkit-search-cancel-button]:appearance-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    inputRef.current?.focus();
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded-full p-1 text-muted-foreground transition-colors hover:text-white"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </motion.div>
          ) : (
            <button
              type="button"
              onClick={openSearch}
              className="cursor-pointer rounded-full p-2 text-copy transition-colors hover:bg-raised hover:text-white"
              aria-label="Search games"
              aria-expanded={false}
            >
              <Search className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.5} />
            </button>
          )}
        </form>

        <div className="flex shrink-0 items-center justify-end gap-2">
          {loading ? (
            <span className="h-9 w-9 animate-pulse rounded-full bg-raised" />
          ) : profile ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex cursor-pointer items-center gap-2 rounded-full outline-none transition-opacity hover:opacity-85"
                  aria-haspopup="menu"
                >
                  <span className="hidden text-sm text-copy md:inline">
                    {profile.username}
                  </span>
                  <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-brand text-sm font-medium text-white ring-1 ring-white/10">
                    {profile.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={profile.avatar_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      profile.username.slice(0, 2).toUpperCase()
                    )}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" role="menu">
                <DropdownMenuItem asChild role="menuitem">
                  <Link href="/profile">My profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild role="menuitem">
                  <Link href="/profile#lists">My lists</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild role="menuitem">
                  <Link href="/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  role="menuitem"
                  onClick={() => signOutAction().then(() => router.push("/"))}
                >
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm">
              <Link href={`/login?next=${next}`}>
                <User className="h-4 w-4" strokeWidth={1.5} />
                Login
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
