"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { signOutAction } from "@/lib/lists/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (pathname === "/search") {
      setQuery(searchParams.get("q") ?? "");
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

  const next = encodeURIComponent(pathname);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:gap-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-lg font-semibold text-foreground">
            Ludi
          </Link>
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Home
          </Link>
        </div>

        <form
          role="search"
          onSubmit={handleSearch}
          className="flex flex-1 gap-2 md:max-w-md"
        >
          <label htmlFor="nav-search" className="sr-only">
            Search games
          </label>
          <Input
            id="nav-search"
            type="search"
            placeholder="Search games…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" variant="outline" size="sm">
            Search
          </Button>
        </form>

        <div className="flex items-center justify-end gap-2">
          {loading ? null : profile ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                  aria-haspopup="menu"
                >
                  <span className="hidden text-sm font-medium md:inline">
                    {profile.username}
                  </span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-medium">
                    {profile.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={profile.avatar_url}
                        alt=""
                        className="h-9 w-9 rounded-full object-cover"
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
              <Link href={`/login?next=${next}`}>Login</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
