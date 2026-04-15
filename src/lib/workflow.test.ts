import { describe, expect, it } from "vitest";
import { assertValidTransition, WorkflowError, nextAllowed, isStatus } from "./workflow";

const assigned = { assignedTo: "user-1" };
const unassigned = { assignedTo: null };

describe("assertValidTransition", () => {
  describe("legal paths", () => {
    it("allows open → in_progress when assigned", () => {
      expect(() => assertValidTransition("open", "in_progress", assigned)).not.toThrow();
    });

    it("allows in_progress → complete when assigned", () => {
      expect(() => assertValidTransition("in_progress", "complete", assigned)).not.toThrow();
    });
  });

  describe("skips", () => {
    it("rejects open → complete", () => {
      expect(() => assertValidTransition("open", "complete", assigned)).toThrow(WorkflowError);
    });
  });

  describe("regressions", () => {
    it("rejects in_progress → open", () => {
      expect(() => assertValidTransition("in_progress", "open", assigned)).toThrow(WorkflowError);
    });

    it("rejects complete → in_progress", () => {
      expect(() => assertValidTransition("complete", "in_progress", assigned)).toThrow(
        WorkflowError
      );
    });

    it("rejects complete → open", () => {
      expect(() => assertValidTransition("complete", "open", assigned)).toThrow(WorkflowError);
    });
  });

  describe("idempotence", () => {
    it("rejects open → open", () => {
      expect(() => assertValidTransition("open", "open", assigned)).toThrow(/already open/);
    });

    it("rejects complete → complete", () => {
      expect(() => assertValidTransition("complete", "complete", assigned)).toThrow(
        /already complete/
      );
    });
  });

  describe("assignment coupling", () => {
    it("rejects open → in_progress without an assignee", () => {
      expect(() => assertValidTransition("open", "in_progress", unassigned)).toThrow(
        /without an assignee/
      );
    });

    it("rejects in_progress → complete without an assignee", () => {
      expect(() => assertValidTransition("in_progress", "complete", unassigned)).toThrow(
        /without an assignee/
      );
    });
  });

  describe("terminal state", () => {
    it("returns no allowed transitions from complete", () => {
      expect(nextAllowed("complete")).toEqual([]);
    });

    it("returns in_progress as only next step from open", () => {
      expect(nextAllowed("open")).toEqual(["in_progress"]);
    });
  });

  describe("isStatus", () => {
    it("accepts known statuses", () => {
      expect(isStatus("open")).toBe(true);
      expect(isStatus("in_progress")).toBe(true);
      expect(isStatus("complete")).toBe(true);
    });

    it("rejects unknown strings", () => {
      expect(isStatus("closed")).toBe(false);
      expect(isStatus("")).toBe(false);
      expect(isStatus(null)).toBe(false);
      expect(isStatus(42)).toBe(false);
    });
  });
});
