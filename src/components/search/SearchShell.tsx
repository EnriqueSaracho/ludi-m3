"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";

type SearchShellContextValue = {
  isPending: boolean;
  navigateSearch: (mutate: (params: URLSearchParams) => void) => void;
};

const SearchShellContext = createContext<SearchShellContextValue | null>(null);

export function useSearchShell() {
  const ctx = useContext(SearchShellContext);
  if (!ctx) {
    throw new Error("useSearchShell must be used within SearchShell");
  }
  return ctx;
}

type Props = {
  children: ReactNode;
};

export function SearchShell({ children }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [liveMessage, setLiveMessage] = useState("");
  const wasPending = useRef(false);

  useEffect(() => {
    if (isPending) {
      setLiveMessage("Updating results…");
      wasPending.current = true;
    } else if (wasPending.current) {
      setLiveMessage("Results updated.");
      wasPending.current = false;
      const t = setTimeout(() => setLiveMessage(""), 1000);
      return () => clearTimeout(t);
    }
  }, [isPending]);

  const navigateSearch = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      startTransition(() => {
        router.push(`/search?${params.toString()}`);
      });
    },
    [router, searchParams],
  );

  return (
    <SearchShellContext.Provider value={{ isPending, navigateSearch }}>
      <div aria-busy={isPending}>
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {liveMessage}
        </div>
        {children}
      </div>
    </SearchShellContext.Provider>
  );
}
