import { assertValidTransition, WorkflowError, type Status } from "../src/lib/workflow";

type Case = {
  name: string;
  from: Status;
  to: Status;
  assignedTo: string | null;
  shouldPass: boolean;
};

const cases: Case[] = [
  { name: "happy: open -> in_progress with assignee", from: "open", to: "in_progress", assignedTo: "worker-1", shouldPass: true },
  { name: "happy: in_progress -> complete with assignee", from: "in_progress", to: "complete", assignedTo: "worker-1", shouldPass: true },

  { name: "reject: open -> complete (skip)", from: "open", to: "complete", assignedTo: "worker-1", shouldPass: false },
  { name: "reject: complete -> open (regression)", from: "complete", to: "open", assignedTo: "worker-1", shouldPass: false },
  { name: "reject: complete -> in_progress (regression)", from: "complete", to: "in_progress", assignedTo: "worker-1", shouldPass: false },
  { name: "reject: in_progress -> open (regression)", from: "in_progress", to: "open", assignedTo: "worker-1", shouldPass: false },

  { name: "reject: open -> in_progress without assignee (coupling)", from: "open", to: "in_progress", assignedTo: null, shouldPass: false },
  { name: "reject: in_progress -> complete without assignee (coupling)", from: "in_progress", to: "complete", assignedTo: null, shouldPass: false },

  { name: "reject: open -> open (no-op)", from: "open", to: "open", assignedTo: "worker-1", shouldPass: false },
];

let failures = 0;
for (const c of cases) {
  let passed: boolean;
  let errMsg = "";
  try {
    assertValidTransition(c.from, c.to, { assignedTo: c.assignedTo });
    passed = true;
  } catch (e) {
    passed = false;
    errMsg = e instanceof WorkflowError ? e.message : String(e);
  }
  const ok = passed === c.shouldPass;
  const icon = ok ? "PASS" : "FAIL";
  console.log(`${icon}  ${c.name}${errMsg ? ` — ${errMsg}` : ""}`);
  if (!ok) failures++;
}

console.log(`\n${cases.length - failures}/${cases.length} passed`);
process.exit(failures === 0 ? 0 : 1);
