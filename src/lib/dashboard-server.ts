import { prisma } from "@/lib/prisma";
import type { DashboardProfile, DashboardStats } from "@/lib/dashboard";

export async function loadDashboardStats(
  projectId: string,
  profiles: DashboardProfile[]
): Promise<DashboardStats> {
  const [statusGroups, priorityGroups, locationGroups, assigneeGroups] = await Promise.all([
    prisma.punchItem.groupBy({
      by: ["status"],
      where: { projectId },
      _count: { _all: true },
    }),
    prisma.punchItem.groupBy({
      by: ["priority"],
      where: { projectId },
      _count: { _all: true },
    }),
    prisma.punchItem.groupBy({
      by: ["location"],
      where: { projectId },
      _count: { _all: true },
    }),
    prisma.punchItem.groupBy({
      by: ["assignedTo"],
      where: { projectId },
      _count: { _all: true },
    }),
  ]);

  const byStatus: Record<string, number> = {};
  let total = 0;
  for (const g of statusGroups) {
    byStatus[g.status] = g._count._all;
    total += g._count._all;
  }
  const complete = byStatus["complete"] ?? 0;
  const pct = total === 0 ? 0 : Math.round((complete / total) * 100);

  const byPriority: Record<string, number> = {};
  for (const g of priorityGroups) byPriority[g.priority] = g._count._all;

  const byLocation: Record<string, number> = {};
  for (const g of locationGroups) byLocation[g.location] = g._count._all;

  const profileById = new Map(profiles.map((p) => [p.id, p]));
  const byAssignee: Record<string, number> = {};
  for (const g of assigneeGroups) {
    const label = !g.assignedTo
      ? "Unassigned"
      : profileById.get(g.assignedTo)?.name ?? "Unknown";
    byAssignee[label] = (byAssignee[label] ?? 0) + g._count._all;
  }

  return { total, complete, pct, byStatus, byPriority, byLocation, byAssignee };
}
