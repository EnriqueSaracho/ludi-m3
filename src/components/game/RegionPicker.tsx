"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { COUNTRIES } from "@/lib/country/countries";
import {
  COUNTRY_COOKIE,
  COUNTRY_COOKIE_MAX_AGE,
} from "@/lib/country/detect";
import { updateProfile } from "@/lib/lists/actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  country: string;
  isAuthed: boolean;
};

/** Region control for the pricing section.
 *
 *  Styled as inline type rather than a form field: it sits inside the sentence
 *  "PC prices for <region>", so the boxed trigger would read as a second, louder
 *  heading directly under the real one. The settings page keeps the plain boxed
 *  version — there it *is* a form. */
export function RegionPicker({ country, isAuthed }: Props) {
  const router = useRouter();
  const [value, setValue] = useState(country);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function change(next: string) {
    const previous = value;
    setValue(next);
    setError(null);

    document.cookie = `${COUNTRY_COOKIE}=${next};path=/;max-age=${COUNTRY_COOKIE_MAX_AGE};SameSite=Lax`;

    startTransition(async () => {
      try {
        /* resolveCountry ranks a saved profile preference above the cookie, so
           for a signed-in user the cookie alone would be ignored on the next
           render and the price would snap back to the old region. */
        if (isAuthed) await updateProfile({ preferred_country: next });
        router.refresh();
      } catch (e) {
        setValue(previous);
        setError(e instanceof Error ? e.message : "Couldn’t switch region.");
      }
    });
  }

  return (
    <>
      <Select value={value} onValueChange={change} disabled={pending}>
        <SelectTrigger
          aria-label="Pricing region"
          aria-busy={pending}
          className="h-auto w-auto gap-1 rounded-none border-0 bg-transparent p-0 text-[0.8125rem] font-medium text-copy shadow-none transition-colors hover:text-brand-tint focus:ring-0 data-[state=open]:text-brand-tint disabled:opacity-60 [&>svg]:h-3.5 [&>svg]:w-3.5 [&>svg]:opacity-40"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {COUNTRIES.map((c) => (
            <SelectItem key={c.code} value={c.code}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <span className="text-destructive">{error}</span>}
    </>
  );
}
