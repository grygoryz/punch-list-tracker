import { cache } from "react";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export const getSessionUser = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
});

export const requireUser = cache(async () => {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
});

export const requireProfile = cache(async () => {
  const user = await requireUser();
  const existing = await prisma.profile.findUnique({ where: { id: user.id } });
  if (existing) return existing;
  try {
    return await prisma.profile.create({
      data: {
        id: user.id,
        email: user.email ?? `${user.id}@unknown`,
        name: user.user_metadata?.name ?? user.email?.split("@")[0] ?? "Anonymous",
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const profile = await prisma.profile.findUnique({ where: { id: user.id } });
      if (profile) return profile;
    }
    throw e;
  }
});
