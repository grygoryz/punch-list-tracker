import type { Priority, Status } from "@/lib/workflow";

export type DashboardItem = {
  status: Status;
  priority: Priority;
  location: string;
  assignedTo: string | null;
};

export type DashboardProfile = { id: string; name: string };

export type DashboardStats = {
  total: number;
  complete: number;
  pct: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  byLocation: Record<string, number>;
  byAssignee: Record<string, number>;
};

function countBy<T, K extends string>(items: T[], keyFn: (item: T) => K): Record<K, number> {
  const out: Record<string, number> = {};
  for (const item of items) {
    const k = keyFn(item);
    out[k] = (out[k] ?? 0) + 1;
  }
  return out as Record<K, number>;
}

export function computeDashboard(
  items: DashboardItem[],
  profiles: DashboardProfile[]
): DashboardStats {
  const total = items.length;
  const complete = items.filter((i) => i.status === "complete").length;
  const pct = total === 0 ? 0 : Math.round((complete / total) * 100);

  const profileById = new Map(profiles.map((p) => [p.id, p]));

  return {
    total,
    complete,
    pct,
    byStatus: countBy(items, (i) => i.status),
    byPriority: countBy(items, (i) => i.priority),
    byLocation: countBy(items, (i) => i.location),
    byAssignee: countBy(items, (i) =>
      !i.assignedTo ? "Unassigned" : profileById.get(i.assignedTo)?.name ?? "Unknown"
    ),
  };
}
