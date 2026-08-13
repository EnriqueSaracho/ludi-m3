"use client";

import { useId, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import type { FacetOption } from "@/lib/igdb/facets";
import { useSearchShell } from "@/components/search/SearchShell";
import { cn } from "@/lib/utils";

type Props = {
  platforms: FacetOption[];
  genres: FacetOption[];
  gameModes: FacetOption[];
};

function toggleParam(params: URLSearchParams, key: string, id: number) {
  const current = params.get(key)?.split(",").filter(Boolean).map(Number) ?? [];
  const next = current.includes(id)
    ? current.filter((x) => x !== id)
    : [...current, id];
  if (next.length) params.set(key, next.join(","));
  else params.delete(key);
  params.delete("page");
}

export function SearchFilters({ platforms, genres, gameModes }: Props) {
  const searchParams = useSearchParams();
  const { isPending, navigateSearch } = useSearchShell();

  function onToggle(key: string, id: number) {
    navigateSearch((params) => toggleParam(params, key, id));
  }

  function isChecked(key: string, id: number) {
    const raw = searchParams.get(key);
    return raw?.split(",").map(Number).includes(id) ?? false;
  }

  function countFor(key: string) {
    return searchParams.get(key)?.split(",").filter(Boolean).length ?? 0;
  }

  return (
    <aside
      className="hidden w-[15rem] shrink-0 lg:block"
      aria-busy={isPending}
      aria-label="Filters"
    >
      <h2 className="mb-4 px-1 text-2xl font-light tracking-tight">Filters</h2>

      <div className="space-y-2">
        <FilterGroup
          label="Platforms"
          items={platforms.slice(0, 24)}
          paramKey="platforms"
          selected={countFor("platforms")}
          defaultOpen
          isChecked={isChecked}
          onToggle={onToggle}
          disabled={isPending}
        />
        <FilterGroup
          label="Genres"
          items={genres.slice(0, 24)}
          paramKey="genres"
          selected={countFor("genres")}
          isChecked={isChecked}
          onToggle={onToggle}
          disabled={isPending}
        />
        <FilterGroup
          label="Number of players"
          items={gameModes}
          paramKey="gameModes"
          selected={countFor("gameModes")}
          isChecked={isChecked}
          onToggle={onToggle}
          disabled={isPending}
        />
      </div>
    </aside>
  );
}

function FilterGroup({
  label,
  items,
  paramKey,
  selected,
  defaultOpen = false,
  isChecked,
  onToggle,
  disabled,
}: {
  label: string;
  items: FacetOption[];
  paramKey: string;
  selected: number;
  defaultOpen?: boolean;
  isChecked: (key: string, id: number) => boolean;
  onToggle: (key: string, id: number) => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className={cn(
          "flex w-full items-center gap-2 rounded-t-md bg-elevated px-3 py-2.5 text-left text-sm transition-colors hover:bg-raised",
          !open && "rounded-b-md",
        )}
      >
        <span className="flex-1 text-foreground">{label}</span>
        {selected > 0 && (
          <span className="rounded-full bg-brand px-1.5 py-0.5 text-[0.6875rem] font-medium leading-none text-white">
            {selected}
          </span>
        )}
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300",
            open && "rotate-180",
          )}
          strokeWidth={1.5}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <ul className="max-h-64 space-y-0.5 overflow-y-auto rounded-b-md bg-sunken p-2">
              {items.map((item) => {
                const checked = isChecked(paramKey, item.id);
                return (
                  <li key={item.id}>
                    <label
                      className={cn(
                        "flex items-center gap-2.5 rounded-sm px-1.5 py-1.5 text-sm transition-colors",
                        disabled
                          ? "cursor-not-allowed opacity-60"
                          : "cursor-pointer hover:bg-white/5",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => onToggle(paramKey, item.id)}
                        className="peer sr-only"
                      />
                      <span
                        aria-hidden
                        className={cn(
                          "flex h-4 w-4 shrink-0 items-center justify-center rounded-[2px] border transition-colors",
                          checked
                            ? "border-brand bg-brand text-white"
                            : "border-hairline-strong bg-transparent",
                          "peer-focus-visible:ring-2 peer-focus-visible:ring-brand peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-sunken",
                        )}
                      >
                        {checked && <Check className="h-3 w-3" strokeWidth={3} />}
                      </span>
                      <span
                        className={cn(
                          "truncate",
                          checked ? "text-foreground" : "text-copy",
                        )}
                      >
                        {item.name}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
