"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/auth";
import { LIMITS } from "@/lib/limits";

const CreateProjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(LIMITS.projectName),
  address: z.string().min(1, "Address is required").max(LIMITS.projectAddress),
});

export type CreateProjectState = { error?: string };

export async function createProject(
  _prev: CreateProjectState,
  formData: FormData
): Promise<CreateProjectState> {
  await requireProfile();
  const parsed = CreateProjectSchema.safeParse({
    name: formData.get("name"),
    address: formData.get("address"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const project = await prisma.project.create({ data: parsed.data });
  revalidatePath("/projects");
  redirect(`/projects/${project.id}`);
}
