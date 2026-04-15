import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProjectStatusBadge } from "@/components/status-badge";
import { Dashboard } from "@/components/dashboard";
import { PunchItemRow } from "@/components/punch-item-row";
import { requireProfile } from "@/lib/auth";
import { getPhotoUrl } from "@/lib/storage";
import type { Priority, Status } from "@/lib/workflow";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const currentProfile = await requireProfile();

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      items: {
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      },
    },
  });
  if (!project) notFound();

  const profiles = await prisma.profile.findMany({ orderBy: { name: "asc" } });

  const itemsWithPhotoUrl = await Promise.all(
    project.items.map(async (item) => ({
      ...item,
      photoUrl: item.photo ? await getPhotoUrl(item.photo) : null,
    }))
  );

  return (
    <div className="space-y-8">
      <div>
        <Link href="/projects" className="text-sm text-neutral-500 hover:text-neutral-900">
          ← Back to projects
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold text-neutral-900 break-all">{project.name}</h1>
              <ProjectStatusBadge status={project.status} />
            </div>
            <p className="text-sm text-neutral-500 break-all">{project.address}</p>
          </div>
          <Link href={`/projects/${project.id}/items/new`}>
            <Button>+ Add punch item</Button>
          </Link>
        </div>
      </div>

      <Dashboard
        items={project.items as { status: Status; priority: Priority; location: string; assignedTo: string | null }[]}
        profiles={profiles}
      />

      <section>
        <h2 className="mb-3 text-lg font-semibold text-neutral-900">
          Items ({project.items.length})
        </h2>
        {project.items.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-neutral-500">No punch items yet.</p>
              <Link href={`/projects/${project.id}/items/new`} className="mt-4 inline-block">
                <Button>Add the first item</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {itemsWithPhotoUrl.map((item) => (
              <PunchItemRow
                key={item.id}
                item={item}
                profiles={profiles}
                currentUserId={currentProfile.id}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
