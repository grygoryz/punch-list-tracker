import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PRIORITY_TONE } from "@/components/status-badge";
import {
  PRIORITIES,
  PRIORITY_LABELS,
  STATUSES,
  STATUS_LABELS,
  type Priority,
  type Status,
} from "@/lib/workflow";

type MinimalItem = {
  status: Status;
  priority: Priority;
  location: string;
  assignedTo: string | null;
};

type Profile = { id: string; name: string; email: string };

function countBy<T, K extends string>(items: T[], keyFn: (item: T) => K): Record<K, number> {
  const out: Record<string, number> = {};
  for (const item of items) {
    const k = keyFn(item);
    out[k] = (out[k] ?? 0) + 1;
  }
  return out as Record<K, number>;
}

export function Dashboard({ items, profiles }: { items: MinimalItem[]; profiles: Profile[] }) {
  const total = items.length;
  const complete = items.filter((i) => i.status === "complete").length;
  const pct = total === 0 ? 0 : Math.round((complete / total) * 100);

  const byStatus = countBy(items, (i) => i.status);
  const byPriority = countBy(items, (i) => i.priority);
  const byLocation = countBy(items, (i) => i.location);

  const profileById = new Map(profiles.map((p) => [p.id, p]));
  const byAssignee = countBy(items, (i) => {
    if (!i.assignedTo) return "Unassigned";
    return profileById.get(i.assignedTo)?.name ?? "Unknown";
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-baseline justify-between">
            <div>
              <h2 className="text-sm font-medium text-neutral-500">Completion</h2>
              <p className="mt-1 text-3xl font-bold text-neutral-900">
                {pct}
                <span className="text-lg text-neutral-500">%</span>
              </p>
              <p className="mt-0.5 text-sm text-neutral-500">
                {complete} of {total} item{total === 1 ? "" : "s"} complete
              </p>
            </div>
            <div className="text-right text-sm">
              {STATUSES.map((status) => (
                <div key={status} className="text-neutral-600">
                  <span className="font-semibold text-neutral-900">{byStatus[status] ?? 0}</span>{" "}
                  {STATUS_LABELS[status].toLowerCase()}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-neutral-100">
            <div className="h-full bg-green-500 transition-all" style={{ width: `${pct}%` }} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <h3 className="text-sm font-medium text-neutral-500">By priority</h3>
            <div className="mt-3 space-y-2">
              {PRIORITIES.map((p) => {
                const value = byPriority[p] ?? 0;
                const barPct = total === 0 ? 0 : Math.round((value / total) * 100);
                return (
                  <div key={p}>
                    <div className="flex items-center justify-between text-sm">
                      <Badge tone={PRIORITY_TONE[p]}>{PRIORITY_LABELS[p]}</Badge>
                      <span className="font-medium text-neutral-900">{value}</span>
                    </div>
                    <div className="mt-1 h-1 overflow-hidden rounded-full bg-neutral-100">
                      <div
                        className={PRIORITY_BAR[p]}
                        style={{ width: `${barPct}%`, height: "100%" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        <BreakdownCard
          title="By location"
          rows={Object.entries(byLocation)
            .sort((a, b) => b[1] - a[1])
            .map(([label, value]) => ({ label, value }))}
          total={total}
        />
        <BreakdownCard
          title="By assignee"
          rows={Object.entries(byAssignee)
            .sort((a, b) => b[1] - a[1])
            .map(([label, value]) => ({ label, value }))}
          total={total}
          rowColor={(label) =>
            label === "Unassigned" ? "bg-neutral-400" : "bg-blue-500"
          }
        />
      </div>
    </div>
  );
}

const PRIORITY_BAR: Record<Priority, string> = {
  low: "bg-neutral-400",
  normal: "bg-blue-500",
  high: "bg-amber-500",
  urgent: "bg-red-500",
};

function BreakdownCard({
  title,
  rows,
  total,
  rowColor,
}: {
  title: string;
  rows: { label: string; value: number }[];
  total: number;
  rowColor?: (label: string) => string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <h3 className="text-sm font-medium text-neutral-500">{title}</h3>
        <div className="mt-3 space-y-2">
          {rows.length === 0 ? (
            <p className="text-sm text-neutral-400">No items</p>
          ) : (
            rows.map((row) => {
              const pct = total === 0 ? 0 : Math.round((row.value / total) * 100);
              const bar = rowColor?.(row.label) ?? "bg-neutral-400";
              return (
                <div key={row.label}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate text-neutral-700">{row.label}</span>
                    <span className="font-medium text-neutral-900">{row.value}</span>
                  </div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-neutral-100">
                    <div className={`h-full ${bar}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
