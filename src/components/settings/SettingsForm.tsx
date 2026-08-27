"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateProfile } from "@/lib/lists/actions";
import { COUNTRIES } from "@/lib/country/countries";
import {
  COUNTRY_COOKIE,
  COUNTRY_COOKIE_MAX_AGE,
} from "@/lib/country/detect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  email: string;
  preferredCountry: string;
};

export function SettingsForm({ email, preferredCountry: initial }: Props) {
  const [country, setCountry] = useState(initial);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [countryPending, setCountryPending] = useState(false);
  const [passwordPending, setPasswordPending] = useState(false);

  async function saveCountry(value: string) {
    const previous = country;
    setCountry(value);
    setCountryPending(true);
    setMessage(null);
    try {
      await updateProfile({ preferred_country: value });
      document.cookie = `${COUNTRY_COOKIE}=${value};path=/;max-age=${COUNTRY_COOKIE_MAX_AGE};SameSite=Lax`;
      setMessage("Country preference saved.");
    } catch (e) {
      setCountry(previous);
      setMessage(e instanceof Error ? e.message : "Failed to save country.");
    } finally {
      setCountryPending(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setMessage("Passwords do not match.");
      return;
    }
    setPasswordPending(true);
    setMessage(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      setMessage(error ? error.message : "Password updated.");
      setPassword("");
      setConfirm("");
    } finally {
      setPasswordPending(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Label>Email</Label>
        <Input value={email} readOnly disabled className="bg-muted" />
      </div>

      <div className="space-y-2">
        <Label>Preferred country (ITAD prices)</Label>
        <Select
          value={country}
          onValueChange={saveCountry}
          disabled={countryPending}
        >
          <SelectTrigger aria-busy={countryPending}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COUNTRIES.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {countryPending && (
          <p className="text-sm text-muted-foreground">Saving…</p>
        )}
      </div>

      <form onSubmit={changePassword} className="space-y-4">
        <h2 className="font-medium">Change password</h2>
        <div className="space-y-2">
          <Label htmlFor="new-pw">New password</Label>
          <Input
            id="new-pw"
            type="password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={passwordPending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-pw">Confirm</Label>
          <Input
            id="confirm-pw"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            disabled={passwordPending}
          />
        </div>
        <Button
          type="submit"
          disabled={passwordPending}
          aria-busy={passwordPending}
        >
          {passwordPending ? "Updating…" : "Update password"}
        </Button>
      </form>

      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}
