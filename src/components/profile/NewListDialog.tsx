"use client";

import { useState } from "react";
import { createList } from "@/lib/lists/actions";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function NewListDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await createList(name.trim());
      setOpen(false);
      setName("");
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          New list
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create list</DialogTitle>
        </DialogHeader>
        <Input
          placeholder="List name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Button onClick={handleCreate} disabled={loading}>
          Create
        </Button>
      </DialogContent>
    </Dialog>
  );
}
