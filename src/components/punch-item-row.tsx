"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { ImageIcon, X } from "lucide-react";
import { toast } from "sonner";
import { assignItem, updateItemStatus, type ActionState } from "@/actions/items";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import { PriorityBadge, StatusBadge } from "@/components/status-badge";
import { nextAllowed, type Priority, type Status } from "@/lib/workflow";

type Profile = { id: string; name: string; email: string };

type Item = {
  id: string;
  location: string;
  description: string;
  status: string;
  priority: string;
  assignedTo: string | null;
  photoUrl: string | null;
};

const initial: ActionState = {};

export function PunchItemRow({
  item,
  profiles,
  currentUserId,
}: {
  item: Item;
  profiles: Profile[];
  currentUserId: string;
}) {
  const status = item.status as Status;
  const priority = item.priority as Priority;
  const isAssignee = item.assignedTo === currentUserId;
  const canAdvance = isAssignee && !!item.assignedTo && status !== "complete";
  const allowed = canAdvance ? nextAllowed(status) : [];
  const assigneeProfile = item.assignedTo ? profiles.find((p) => p.id === item.assignedTo) : null;

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row">
          <PhotoThumb url={item.photoUrl} alt={item.description} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={status} />
              <PriorityBadge priority={priority} />
              <span className="text-sm font-medium text-neutral-900 break-all">{item.location}</span>
            </div>
            <p className="mt-2 text-sm text-neutral-700 whitespace-pre-wrap break-words">{item.description}</p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <AssignControl
                itemId={item.id}
                current={item.assignedTo}
                profiles={profiles}
                disabled={status === "complete"}
              />
              {allowed.map((toStatus) => (
                <TransitionButton key={toStatus} itemId={item.id} toStatus={toStatus} />
              ))}
              {status === "complete" && (
                <span className="text-xs text-neutral-400">Complete — no further actions</span>
              )}
              {status !== "complete" && item.assignedTo && !isAssignee && assigneeProfile && (
                <span className="text-xs text-neutral-400">
                  Only {assigneeProfile.name} can update status
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AssignControl({
  itemId,
  current,
  profiles,
  disabled,
}: {
  itemId: string;
  current: string | null;
  profiles: Profile[];
  disabled?: boolean;
}) {
  const [state, formAction, pending] = useActionState(assignItem, initial);

  useEffect(() => {
    if (state.error) toast.error(state.error);
  }, [state]);

  if (current) {
    const profile = profiles.find((p) => p.id === current);
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs text-blue-900">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
        Assigned to{" "}
        <span className="font-medium">{profile?.name ?? "Unknown"}</span>
      </span>
    );
  }

  if (disabled) return null;

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="itemId" value={itemId} />
      <Select
        name="assignedTo"
        defaultValue=""
        disabled={pending}
        onChange={(e) => {
          if (e.currentTarget.value) e.currentTarget.form?.requestSubmit();
        }}
        className="h-8 w-52 text-xs"
      >
        <option value="" disabled>
          Assign worker…
        </option>
        {profiles.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </Select>
    </form>
  );
}

function PhotoThumb({ url, alt }: { url: string | null; alt: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!url) {
    return (
      <div className="flex h-32 w-full flex-shrink-0 items-center justify-center rounded-md border border-dashed border-neutral-200 bg-neutral-50 text-neutral-300 sm:h-24 sm:w-32">
        <ImageIcon className="h-8 w-8" strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative h-32 w-full flex-shrink-0 cursor-zoom-in overflow-hidden rounded-md bg-neutral-100 sm:h-24 sm:w-32"
      >
        <Image
          src={url}
          alt={alt}
          fill
          className="object-cover transition group-hover:opacity-90"
          sizes="(max-width: 640px) 100vw, 128px"
        />
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setOpen(false)}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}
            className="absolute top-4 right-4 cursor-pointer rounded-full bg-black/40 p-2 text-white hover:bg-black/60"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={alt}
            className="max-h-full max-w-full rounded-md object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

function TransitionButton({ itemId, toStatus }: { itemId: string; toStatus: Status }) {
  const [state, formAction, pending] = useActionState(updateItemStatus, initial);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (state.error) toast.error(state.error);
  }, [state]);

  const label =
    toStatus === "in_progress"
      ? "Start work"
      : toStatus === "complete"
      ? "Mark complete"
      : `→ ${toStatus}`;

  return (
    <form action={(fd) => startTransition(() => formAction(fd))} className="inline">
      <input type="hidden" name="itemId" value={itemId} />
      <input type="hidden" name="toStatus" value={toStatus} />
      <Button type="submit" size="sm" variant="secondary" disabled={pending}>
        {label}
      </Button>
    </form>
  );
}
