"use client";

import { useSearchParams } from "next/navigation";
import type { FacetOption } from "@/lib/igdb/facets";
import { useSearchShell } from "@/components/search/SearchShell";
import { Label } from "@/components/ui/label";

type Props = {
  platforms: FacetOption[];
  genres: FacetOption[];
  gameModes: FacetOption[];
};

function toggleParam(
  params: URLSearchParams,
  key: string,
  id: number,
) {
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
    navigateSearch((params) => {
      toggleParam(params, key, id);
    });
  }

  function isChecked(key: string, id: number) {
    const raw = searchParams.get(key);
    return raw?.split(",").map(Number).includes(id) ?? false;
  }

  return (
    <aside className="hidden w-52 shrink-0 space-y-6 lg:block" aria-busy={isPending}>
      <FilterGroup
        label="Platforms"
        items={platforms.slice(0, 20)}
        paramKey="platforms"
        isChecked={isChecked}
        onToggle={onToggle}
        disabled={isPending}
      />
      <FilterGroup
        label="Genres"
        items={genres.slice(0, 20)}
        paramKey="genres"
        isChecked={isChecked}
        onToggle={onToggle}
        disabled={isPending}
      />
      <FilterGroup
        label="Player modes"
        items={gameModes}
        paramKey="gameModes"
        isChecked={isChecked}
        onToggle={onToggle}
        disabled={isPending}
      />
    </aside>
  );
}

function FilterGroup({
  label,
  items,
  paramKey,
  isChecked,
  onToggle,
  disabled,
}: {
  label: string;
  items: FacetOption[];
  paramKey: string;
  isChecked: (key: string, id: number) => boolean;
  onToggle: (key: string, id: number) => void;
  disabled: boolean;
}) {
  return (
    <div>
      <Label className="text-sm font-medium">{label}</Label>
      <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-sm">
        {items.map((item) => (
          <li key={item.id}>
            <label
              className={
                disabled
                  ? "flex cursor-not-allowed items-center gap-2 opacity-60"
                  : "flex cursor-pointer items-center gap-2"
              }
            >
              <input
                type="checkbox"
                checked={isChecked(paramKey, item.id)}
                disabled={disabled}
                onChange={() => onToggle(paramKey, item.id)}
                className="rounded border-border"
              />
              <span className="truncate">{item.name}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
