export const STATUSES = ["open", "in_progress", "complete"] as const;
export type Status = (typeof STATUSES)[number];

export const PRIORITIES = ["low", "normal", "high", "urgent"] as const;
export type Priority = (typeof PRIORITIES)[number];

const ALLOWED: Record<Status, ReadonlyArray<Status>> = {
  open: ["in_progress"],
  in_progress: ["complete"],
  complete: [],
};

export function isStatus(value: unknown): value is Status {
  return typeof value === "string" && (STATUSES as readonly string[]).includes(value);
}

export type TransitionContext = { assignedTo: string | null | undefined };

export class WorkflowError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WorkflowError";
  }
}

export function assertValidTransition(from: Status, to: Status, ctx: TransitionContext): void {
  if (from === to) {
    throw new WorkflowError(`Item is already ${from}.`);
  }
  const allowed = ALLOWED[from];
  if (!allowed.includes(to)) {
    throw new WorkflowError(
      `Illegal transition: ${from} → ${to}. Allowed from ${from}: ${allowed.join(", ") || "(terminal)"}.`
    );
  }
  if (to !== "open" && !ctx.assignedTo) {
    throw new WorkflowError(
      `Cannot advance to ${to} without an assignee. Assign the item to a worker first.`
    );
  }
}

export function nextAllowed(from: Status): ReadonlyArray<Status> {
  return ALLOWED[from];
}

export const STATUS_LABELS: Record<Status, string> = {
  open: "Open",
  in_progress: "In progress",
  complete: "Complete",
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
};
