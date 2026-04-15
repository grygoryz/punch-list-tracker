import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProjectStatusBadge } from "@/components/status-badge";
import { Dashboard } from "@/components/dashboard";
import { PunchItemRow } from "@/components/punch-item-row";
import { requireProfile } from "@/lib/auth";
import { getPhotoUrls } from "@/lib/storage";
import { loadDashboardStats } from "@/lib/dashboard-server";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id } = await params;
  const { page: pageParam } = await searchParams;
  const currentProfile = await requireProfile();

  const [project, profiles] = await Promise.all([
    prisma.project.findUnique({
      where: { id },
      select: { id: true, name: true, address: true, status: true },
    }),
    prisma.profile.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    }),
  ]);
  if (!project) notFound();

  const rawPage = Number(pageParam);
  const requestedPage = Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1;

  const [stats, rows] = await Promise.all([
    loadDashboardStats(project.id, profiles),
    prisma.punchItem.findMany({
      where: { projectId: project.id },
      orderBy: { createdAt: "desc" },
      skip: (requestedPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        location: true,
        description: true,
        status: true,
        priority: true,
        assignedTo: true,
        photo: true,
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(stats.total / PAGE_SIZE));
  const page = Math.min(totalPages, requestedPage);

  const photoUrls = await getPhotoUrls(rows.map((r) => r.photo));
  const items = rows.map((r, i) => ({
    id: r.id,
    location: r.location,
    description: r.description,
    status: r.status,
    priority: r.priority,
    assignedTo: r.assignedTo,
    photoUrl: photoUrls[i],
  }));

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

      <Dashboard stats={stats} />

      <section>
        <h2 className="mb-3 text-lg font-semibold text-neutral-900">
          Items ({stats.total})
        </h2>
        {stats.total === 0 ? (
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
            {items.map((item) => (
              <PunchItemRow
                key={item.id}
                item={item}
                profiles={profiles}
                currentUserId={currentProfile.id}
              />
            ))}
            {totalPages > 1 && (
              <Pagination projectId={project.id} page={page} totalPages={totalPages} />
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function Pagination({
  projectId,
  page,
  totalPages,
}: {
  projectId: string;
  page: number;
  totalPages: number;
}) {
  const linkClass =
    "rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-700 hover:border-neutral-400 hover:text-neutral-900";
  const disabledClass =
    "rounded-md border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-sm text-neutral-400 cursor-not-allowed";

  return (
    <nav className="flex items-center justify-between pt-4" aria-label="Pagination">
      {page > 1 ? (
        <Link href={`/projects/${projectId}?page=${page - 1}`} className={linkClass}>
          ← Previous
        </Link>
      ) : (
        <span className={cn(disabledClass)}>← Previous</span>
      )}
      <span className="text-sm text-neutral-500 tabular-nums">
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={`/projects/${projectId}?page=${page + 1}`} className={linkClass}>
          Next →
        </Link>
      ) : (
        <span className={cn(disabledClass)}>Next →</span>
      )}
    </nav>
  );
}
