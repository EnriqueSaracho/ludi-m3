import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/settings/SettingsForm";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/settings");

  const { data: profile } = await supabase
    .from("profiles")
    .select("preferred_country")
    .eq("id", user.id)
    .single();

  return (
    <div className="shell max-w-md space-y-8 py-12">
      <h1 className="text-3xl font-light tracking-tight">Settings</h1>
      <SettingsForm
        email={user.email ?? ""}
        preferredCountry={profile?.preferred_country ?? "US"}
      />
    </div>
  );
}
