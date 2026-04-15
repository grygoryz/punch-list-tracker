"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/auth";
import { uploadPhoto } from "@/lib/storage";
import { LIMITS } from "@/lib/limits";
import {
  assertValidTransition,
  isStatus,
  PRIORITIES,
  STATUSES,
  WorkflowError,
  type Status,
} from "@/lib/workflow";

const CreateItemSchema = z.object({
  projectId: z.string().uuid(),
  location: z.string().min(1, "Location is required").max(LIMITS.itemLocation),
  description: z.string().min(1, "Description is required").max(LIMITS.itemDescription),
  priority: z.enum(PRIORITIES),
  assignedTo: z.string().min(1).max(200).nullable(),
});

export type ActionState = { error?: string };

export async function createItem(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const profile = await requireProfile();
  const rawAssigned = formData.get("assignedTo");
  const parsed = CreateItemSchema.safeParse({
    projectId: formData.get("projectId"),
    location: formData.get("location"),
    description: formData.get("description"),
    priority: formData.get("priority"),
    assignedTo:
      rawAssigned && String(rawAssigned).trim() !== "" ? String(rawAssigned) : null,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  let photoPath: string | null = null;
  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0) {
    if (!photo.type.startsWith("image/")) {
      return { error: "Photo must be an image file." };
    }
    if (photo.size > LIMITS.photoBytes) {
      return {
        error: `Photo is too large (max ${Math.round(LIMITS.photoBytes / 1024 / 1024)} MB).`,
      };
    }
    try {
      photoPath = await uploadPhoto(photo, `project-${parsed.data.projectId}`);
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Photo upload failed" };
    }
  }

  await prisma.punchItem.create({
    data: {
      projectId: parsed.data.projectId,
      location: parsed.data.location,
      description: parsed.data.description,
      priority: parsed.data.priority,
      assignedTo: parsed.data.assignedTo,
      photo: photoPath,
      createdBy: profile.id,
    },
  });

  revalidatePath(`/projects/${parsed.data.projectId}`);
  redirect(`/projects/${parsed.data.projectId}`);
}

const AssignSchema = z.object({
  itemId: z.string().uuid(),
  assignedTo: z.string().min(1).max(200),
});

export async function assignItem(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireProfile();
  const raw = formData.get("assignedTo");
  const parsed = AssignSchema.safeParse({
    itemId: formData.get("itemId"),
    assignedTo: raw && String(raw).trim() !== "" ? String(raw) : undefined,
  });
  if (!parsed.success) return { error: "Pick someone to assign." };

  const updated = await prisma.punchItem.updateManyAndReturn({
    where: { id: parsed.data.itemId, assignedTo: null },
    data: { assignedTo: parsed.data.assignedTo },
    select: { projectId: true },
  });

  if (updated.length === 0) {
    const existing = await prisma.punchItem.findUnique({
      where: { id: parsed.data.itemId },
      select: { id: true },
    });
    if (!existing) return { error: "Item not found" };
    return { error: "This item is already assigned and cannot be reassigned." };
  }

  revalidatePath(`/projects/${updated[0].projectId}`);
  return {};
}

const TransitionSchema = z.object({
  itemId: z.string().uuid(),
  toStatus: z.enum(STATUSES),
});

export async function updateItemStatus(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const profile = await requireProfile();
  const parsed = TransitionSchema.safeParse({
    itemId: formData.get("itemId"),
    toStatus: formData.get("toStatus"),
  });
  if (!parsed.success) return { error: "Invalid status transition" };

  const item = await prisma.punchItem.findUnique({
    where: { id: parsed.data.itemId },
    select: { id: true, status: true, assignedTo: true, projectId: true },
  });
  if (!item) return { error: "Item not found" };
  if (!isStatus(item.status)) return { error: `Corrupt item status: ${item.status}` };

  if (item.assignedTo !== profile.id) {
    return { error: "Only the assignee can change this item's status." };
  }

  try {
    assertValidTransition(item.status as Status, parsed.data.toStatus, {
      assignedTo: item.assignedTo,
    });
  } catch (e) {
    if (e instanceof WorkflowError) return { error: e.message };
    throw e;
  }

  const result = await prisma.punchItem.updateMany({
    where: { id: item.id, status: item.status, assignedTo: item.assignedTo },
    data: { status: parsed.data.toStatus },
  });
  if (result.count === 0) {
    return { error: "Item changed while you were editing. Refresh and try again." };
  }
  revalidatePath(`/projects/${item.projectId}`);
  return {};
}
