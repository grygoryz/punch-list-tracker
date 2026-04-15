"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { createProject, type CreateProjectState } from "@/actions/projects";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { LIMITS } from "@/lib/limits";
import { cn } from "@/lib/utils";

const initial: CreateProjectState = {};

const OVER_INPUT = "border-red-500 focus-visible:ring-red-500";

export function NewProjectForm() {
  const [state, formAction, pending] = useActionState(createProject, initial);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    if (state.error) toast.error(state.error);
  }, [state]);

  const nameOver = name.length > LIMITS.projectName;
  const addressOver = address.length > LIMITS.projectAddress;
  const invalid = nameOver || addressOver || !name.trim() || !address.trim();

  return (
    <Card>
      <CardContent className="p-6">
        <form action={formAction} className="space-y-4">
          <div>
            <div className="flex items-end justify-between">
              <Label htmlFor="name">Project name</Label>
              <CharCount value={name.length} max={LIMITS.projectName} />
            </div>
            <Input
              id="name"
              name="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={cn(nameOver && OVER_INPUT)}
              placeholder="123 Main St renovation"
            />
          </div>
          <div>
            <div className="flex items-end justify-between">
              <Label htmlFor="address">Address</Label>
              <CharCount value={address.length} max={LIMITS.projectAddress} />
            </div>
            <Input
              id="address"
              name="address"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className={cn(addressOver && OVER_INPUT)}
              placeholder="123 Main St, Anytown"
            />
          </div>
          <Button type="submit" disabled={pending || invalid} className="w-full">
            {pending ? "Creating…" : "Create project"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function CharCount({ value, max }: { value: number; max: number }) {
  const over = value > max;
  return (
    <span
      className={cn(
        "text-xs tabular-nums",
        over ? "text-red-600 font-medium" : "text-neutral-400"
      )}
    >
      {value} / {max}
    </span>
  );
}
