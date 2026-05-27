"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateProfile } from "@/lib/lists/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  username: string;
  avatarUrl: string | null;
  userId: string;
};

export function ProfileEditor({ username: initial, avatarUrl, userId }: Props) {
  const [username, setUsername] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function saveUsername() {
    setSaving(true);
    try {
      await updateProfile({ username });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    }
    setSaving(false);
  }

  async function uploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || file.size > 2 * 1024 * 1024) return;
    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${userId}/avatar.${ext}`;
    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      await updateProfile({ avatar_url: data.publicUrl });
      window.location.reload();
    }
    setUploading(false);
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <label className="relative flex h-20 w-20 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-muted text-2xl font-medium">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          username.slice(0, 2).toUpperCase()
        )}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={uploadAvatar}
          disabled={uploading}
        />
      </label>
      <div className="flex flex-1 flex-wrap items-end gap-2">
        <div className="flex-1 min-w-[200px]">
          <label className="text-sm text-muted-foreground">Username</label>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={24}
          />
        </div>
        <Button onClick={saveUsername} disabled={saving} size="sm">
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
}
