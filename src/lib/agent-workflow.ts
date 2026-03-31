/**
 * Agent Workflow / Handoff Manager
 *
 * Defines how work moves between the four mission-control agents:
 * 1. Master Researcher & Data Collector
 * 2. Master Coder & Developer
 * 3. Project Manager / Architect / Supervisor
 * 4. Finance Department
 *
 * Each handoff includes:
 * - from: source agent role key
 * - to: target agent role key
 * - payload: the information being passed
 * - cost: token/dollar estimate at time of handoff
 * - approved: whether this step needs human/Jarvis approval
 * - blockers: outstanding issues before handoff can proceed
 */

import type { OfficeRoleKey } from "@/lib/agent-office-roles";
import { OFFICE_ROLES } from "@/lib/agent-office-roles";

export type HandoffStep =
  | "intake"
  | "research"
  | "plan"
  | "cost_analysis"
  | "approval"
  | "execution"
  | "verification"
  | "delivery";

export type HandoffStatus = "pending" | "in_progress" | "approved" | "blocked" | "completed";

export interface HandoffPayload {
  projectId: string;
  projectName: string;
  goal: string;
  constraints?: string[];
  deadline?: string;
  researchData?: string;
  planBlueprint?: string;
  costEstimate?: number;
  costLineItems?: CostLineItem[];
  approvedBy?: string;
  notes?: string;
}

export interface CostLineItem {
  step: HandoffStep;
  agent: OfficeRoleKey;
  estimatedTokens: number;
  estimatedDollars: number;
  actualTokens?: number;
  actualDollars?: number;
}

export interface HandoffRecord {
  id: string;
  step: HandoffStep;
  status: HandoffStatus;
  from: OfficeRoleKey;
  to: OfficeRoleKey;
  payload: HandoffPayload;
  costAtHandoff?: number;
  approvedBy?: string;
  approvedAt?: number;
  blockedReason?: string;
  createdAt: number;
  updatedAt: number;
}

export interface WorkflowState {
  projectId: string;
  projectName: string;
  goal: string;
  status: "active" | "paused" | "complete" | "cancelled";
  currentStep: HandoffStep;
  handovers: HandoffRecord[];
  totalCostEstimate: number;
  totalCostActual: number;
  createdAt: number;
  updatedAt: number;
}

/**
 * Default handoff sequence for a project through the office.
 *
 * Sequence:
 * 1. intake       → Project Manager receives the goal
 * 2. research     → Researcher gathers data (if needed)
 * 3. plan         → Project Manager creates blueprint
 * 4. cost_analysis → Finance reviews and estimates
 * 5. approval     → Human/Jarvis approves
 * 6. execution    → Coder builds
 * 7. verification → Coder verifies, Project Manager checks
 * 8. delivery     → Project Manager reports back
 */

export const HANDOFF_SEQUENCE: HandoffStep[] = [
  "intake",
  "research",
  "plan",
  "cost_analysis",
  "approval",
  "execution",
  "verification",
  "delivery",
];

export const STEP_TO_ROLE: Record<HandoffStep, OfficeRoleKey | "human"> = {
  intake: "project-manager",
  research: "master-researcher",
  plan: "project-manager",
  cost_analysis: "finance-department",
  approval: "human",
  execution: "master-coder",
  verification: "master-coder",
  delivery: "project-manager",
};

export const REQUIRES_APPROVAL: HandoffStep[] = [
  "cost_analysis",
  "approval",
];

export function createWorkflow(
  projectId: string,
  projectName: string,
  goal: string,
): WorkflowState {
  return {
    projectId,
    projectName,
    goal,
    status: "active",
    currentStep: "intake",
    handovers: [],
    totalCostEstimate: 0,
    totalCostActual: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function nextStep(current: HandoffStep): HandoffStep | null {
  const idx = HANDOFF_SEQUENCE.indexOf(current);
  if (idx === -1 || idx === HANDOFF_SEQUENCE.length - 1) return null;
  return HANDOFF_SEQUENCE[idx + 1];
}

export function stepLabel(step: HandoffStep): string {
  const labels: Record<HandoffStep, string> = {
    intake: "Intake",
    research: "Research",
    plan: "Planning",
    cost_analysis: "Cost Analysis",
    approval: "Approval",
    execution: "Execution",
    verification: "Verification",
    delivery: "Delivery",
  };
  return labels[step];
}

export function roleLabel(role: OfficeRoleKey | "human"): string {
  if (role === "human") return "Human / Jarvis";
  return OFFICE_ROLES[role]?.name ?? role;
}

export function canProceedToNextStep(
  workflow: WorkflowState,
  currentHandoff: HandoffRecord,
): { can: boolean; reason?: string } {
  if (currentHandoff.status === "blocked") {
    return { can: false, reason: currentHandoff.blockedReason ?? "Step is blocked" };
  }
  if (currentHandoff.status === "pending" || currentHandoff.status === "in_progress") {
    return { can: false, reason: "Step is not yet complete" };
  }
  if (REQUIRES_APPROVAL.includes(currentHandoff.step) && !currentHandoff.approvedBy) {
    return { can: false, reason: "Awaiting approval before proceeding" };
  }
  return { can: true };
}

export function buildHandoffPayload(
  workflow: WorkflowState,
  step: HandoffStep,
  overrides?: Partial<HandoffPayload>,
): HandoffPayload {
  return {
    projectId: workflow.projectId,
    projectName: workflow.projectName,
    goal: workflow.goal,
    ...overrides,
  };
}
