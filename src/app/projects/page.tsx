import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProjectStatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const [projects, statusGroups] = await Promise.all([
    prisma.project.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.punchItem.groupBy({
      by: ["projectId", "status"],
      _count: { _all: true },
    }),
  ]);

  const statsByProject = new Map<string, { total: number; complete: number }>();
  for (const g of statusGroups) {
    const s = statsByProject.get(g.projectId) ?? { total: 0, complete: 0 };
    s.total += g._count._all;
    if (g.status === "complete") s.complete += g._count._all;
    statsByProject.set(g.projectId, s);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Projects</h1>
          <p className="text-sm text-neutral-500">
            {projects.length} project{projects.length === 1 ? "" : "s"}
          </p>
        </div>
        <Link href="/projects/new">
          <Button>+ New project</Button>
        </Link>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-neutral-500">No projects yet.</p>
            <Link href="/projects/new" className="mt-4 inline-block">
              <Button>Create your first project</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const { total, complete } = statsByProject.get(project.id) ?? {
              total: 0,
              complete: 0,
            };
            const pct = total === 0 ? 0 : Math.round((complete / total) * 100);
            return (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="h-full cursor-pointer transition-shadow hover:shadow-md">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-neutral-900 line-clamp-1">{project.name}</h3>
                      <ProjectStatusBadge status={project.status} />
                    </div>
                    <p className="mt-0.5 text-sm text-neutral-500 line-clamp-1">
                      {project.address}
                    </p>
                    <div className="mt-4 flex items-center justify-between text-sm">
                      <span className="text-neutral-500">
                        {complete}/{total} complete
                      </span>
                      <span className="font-medium text-neutral-900">{pct}%</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-100">
                      <div
                        className="h-full bg-green-500 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="mt-4 text-xs text-neutral-400">
                      Created {formatDate(project.createdAt)}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
