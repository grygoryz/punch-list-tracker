import { describe, expect, it } from "vitest";
import { computeDashboard, type DashboardItem } from "./dashboard";

const alice = { id: "u1", name: "Alice" };
const bob = { id: "u2", name: "Bob" };

function item(overrides: Partial<DashboardItem> = {}): DashboardItem {
  return {
    status: "open",
    priority: "normal",
    location: "Unit 101",
    assignedTo: null,
    ...overrides,
  };
}

describe("computeDashboard", () => {
  it("returns zeros for an empty list", () => {
    const stats = computeDashboard([], []);
    expect(stats.total).toBe(0);
    expect(stats.complete).toBe(0);
    expect(stats.pct).toBe(0);
  });

  it("computes completion percentage, rounding to nearest integer", () => {
    const items = [
      item({ status: "complete" }),
      item({ status: "complete" }),
      item({ status: "open" }),
    ];
    const stats = computeDashboard(items, []);
    expect(stats.total).toBe(3);
    expect(stats.complete).toBe(2);
    expect(stats.pct).toBe(67);
  });

  it("reports 100% when every item is complete", () => {
    const items = [item({ status: "complete" }), item({ status: "complete" })];
    expect(computeDashboard(items, []).pct).toBe(100);
  });

  it("groups by status, priority, and location", () => {
    const items = [
      item({ status: "open", priority: "high", location: "Unit 101" }),
      item({ status: "open", priority: "high", location: "Unit 101" }),
      item({ status: "in_progress", priority: "low", location: "Unit 202" }),
      item({ status: "complete", priority: "urgent", location: "Unit 202" }),
    ];
    const stats = computeDashboard(items, []);
    expect(stats.byStatus).toEqual({ open: 2, in_progress: 1, complete: 1 });
    expect(stats.byPriority).toEqual({ high: 2, low: 1, urgent: 1 });
    expect(stats.byLocation).toEqual({ "Unit 101": 2, "Unit 202": 2 });
  });

  it("groups assignees by profile name, bucketing nulls as Unassigned", () => {
    const items = [
      item({ assignedTo: "u1" }),
      item({ assignedTo: "u1" }),
      item({ assignedTo: "u2" }),
      item({ assignedTo: null }),
      item({ assignedTo: null }),
    ];
    const stats = computeDashboard(items, [alice, bob]);
    expect(stats.byAssignee).toEqual({ Alice: 2, Bob: 1, Unassigned: 2 });
  });

  it("labels orphaned assignee IDs as Unknown", () => {
    const items = [item({ assignedTo: "ghost" })];
    const stats = computeDashboard(items, [alice]);
    expect(stats.byAssignee).toEqual({ Unknown: 1 });
  });
});
