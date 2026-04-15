"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { createItem, type ActionState } from "@/actions/items";
import { Button } from "@/components/ui/button";
import { Input, Label, SelectField, Textarea } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { PRIORITIES, PRIORITY_LABELS } from "@/lib/workflow";
import { LIMITS } from "@/lib/limits";
import { cn } from "@/lib/utils";

const initial: ActionState = {};

type Profile = { id: string; name: string; email: string };

const OVER_INPUT = "border-red-500 focus-visible:ring-red-500";

export function NewItemForm({
  projectId,
  profiles,
}: {
  projectId: string;
  profiles: Profile[];
}) {
  const [state, formAction, pending] = useActionState(createItem, initial);
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (state.error) toast.error(state.error);
  }, [state]);

  const locationOver = location.length > LIMITS.itemLocation;
  const descriptionOver = description.length > LIMITS.itemDescription;
  const invalid =
    locationOver || descriptionOver || !location.trim() || !description.trim();

  return (
    <Card>
      <CardContent className="p-6">
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="projectId" value={projectId} />
          <div>
            <div className="flex items-end justify-between">
              <Label htmlFor="location">Location</Label>
              <CharCount value={location.length} max={LIMITS.itemLocation} />
            </div>
            <Input
              id="location"
              name="location"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className={cn(locationOver && OVER_INPUT)}
              placeholder="Unit 204 - Kitchen"
            />
          </div>
          <div>
            <div className="flex items-end justify-between">
              <Label htmlFor="description">Description</Label>
              <CharCount value={description.length} max={LIMITS.itemDescription} />
            </div>
            <Textarea
              id="description"
              name="description"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={cn(descriptionOver && OVER_INPUT)}
              placeholder="Drywall patch needed behind door"
              rows={4}
            />
          </div>
          <div>
            <Label htmlFor="priority">Priority</Label>
            <SelectField id="priority" name="priority" defaultValue="normal" required>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABELS[p]}
                </option>
              ))}
            </SelectField>
          </div>
          <div>
            <Label htmlFor="assignedTo">Assign to (optional)</Label>
            <SelectField id="assignedTo" name="assignedTo" defaultValue="">
              <option value="">Unassigned</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </SelectField>
          </div>
          <div>
            <Label htmlFor="photo">Photo (optional)</Label>
            <Input id="photo" name="photo" type="file" accept="image/*" />
          </div>
          <Button type="submit" disabled={pending || invalid} className="w-full">
            {pending ? "Creating…" : "Add item"}
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
