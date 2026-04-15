import { Badge } from "@/components/ui/badge";
import type { Status, Priority } from "@/lib/workflow";
import { STATUS_LABELS, PRIORITY_LABELS } from "@/lib/workflow";

export const STATUS_TONE = {
  open: "neutral",
  in_progress: "blue",
  complete: "green",
} as const;

export const PRIORITY_TONE = {
  low: "neutral",
  normal: "blue",
  high: "amber",
  urgent: "red",
} as const;

export function StatusBadge({ status }: { status: Status }) {
  return <Badge tone={STATUS_TONE[status]}>{STATUS_LABELS[status]}</Badge>;
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <Badge tone={PRIORITY_TONE[priority]}>{PRIORITY_LABELS[priority]}</Badge>;
}

export function ProjectStatusBadge({ status }: { status: string }) {
  const tone = status === "active" ? "blue" : "green";
  const label = status === "active" ? "Active" : status.charAt(0).toUpperCase() + status.slice(1);
  return <Badge tone={tone}>{label}</Badge>;
}
