import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/auth";
import { NewItemForm } from "./form";

export default async function NewItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireProfile();
  const project = await prisma.project.findUnique({
    where: { id },
    select: { id: true, name: true },
  });
  if (!project) notFound();

  const profiles = await prisma.profile.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <Link
          href={`/projects/${project.id}`}
          className="inline-block max-w-full truncate text-sm text-neutral-500 hover:text-neutral-900"
        >
          ← Back to {project.name}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-neutral-900">Add punch item</h1>
      </div>
      <NewItemForm projectId={project.id} profiles={profiles} />
    </div>
  );
}
