import type { AgentZone } from "@/gateway/types";

export type OfficeRoleKey =
  | "master-researcher"
  | "master-coder"
  | "project-manager"
  | "finance-department";

export interface OfficeRole {
  key: OfficeRoleKey;
  name: string;
  subtitle: string;
  zone: AgentZone;
  canDo: string[];
  cantDo: string[];
  skills: string[];
  tools: string[];
  responsibilities: string[];
  description: string;
  color: string;
}

export const OFFICE_ROLES: Record<OfficeRoleKey, OfficeRole> = {
  "master-researcher": {
    key: "master-researcher",
    name: "Master Researcher & Data Collector",
    subtitle: "Master Connector",
    zone: "desk",
    color: "#06b6d4",
    skills: [
      "data aggregation",
      "source normalization",
      "business intelligence",
      "cross-app synthesis",
      "low-token summarization",
    ],
    tools: ["Asana", "Google Calendar", "Otter", "Gmail", "Slack"],
    responsibilities: [
      "Gather business-side data",
      "Normalize information into usable intelligence",
      "Create source maps and structured summaries",
      "Flag missing data and inconsistencies",
    ],
    canDo: [
      "Collect and organize approved business data",
      "Produce concise insight briefs",
      "Map sources to projects and decisions",
      "Support planning with evidence",
    ],
    cantDo: [
      "Overspend token budget",
      "Make architecture decisions alone",
      "Change live production configs without approval",
      "Assume unverified data is correct",
    ],
    description:
      "Centralizes business intelligence from approved systems and turns it into organized, low-cost insight for the rest of the office.",
  },
  "master-coder": {
    key: "master-coder",
    name: "Master Coder & Developer",
    subtitle: "UI/UX Expert & Veteran Developer",
    zone: "hotDesk",
    color: "#8b5cf6",
    skills: [
      "UI engineering",
      "debugging",
      "refactoring",
      "test-first execution",
      "robust implementation",
    ],
    tools: ["TypeScript", "React", "Vite", "Gateway APIs", "DevTools"],
    responsibilities: [
      "Translate instructions into efficient builds",
      "Implement robust features",
      "Verify code before handoff",
      "Fix bugs and harden systems",
    ],
    canDo: [
      "Build apps and workflows",
      "Debug and verify its own work",
      "Optimize for token efficiency",
      "Refactor for maintainability",
    ],
    cantDo: [
      "Skip verification",
      "Ignore the project plan",
      "Change scope without approval",
      "Ship untested work",
    ],
    description:
      "Executes the technical build with a strict verify-before-handoff mindset and a strong bias toward robust, efficient code.",
  },
  "project-manager": {
    key: "project-manager",
    name: "Project Manager / Architect / Supervisor",
    subtitle: "Strategy & Operations Coordinator",
    zone: "meeting",
    color: "#22c55e",
    skills: [
      "project architecture",
      "risk analysis",
      "dependency mapping",
      "cross-agent coordination",
      "delivery planning",
    ],
    tools: ["Plans", "Milestones", "Approvals", "Agent Routing", "Reviews"],
    responsibilities: [
      "Turn goals into a full plan",
      "Coordinate handoffs",
      "Monitor execution",
      "Escalate cost or scope changes",
    ],
    canDo: [
      "Design project blueprints",
      "Assign work across agents",
      "Track progress and blockers",
      "Approve minor pivots",
    ],
    cantDo: [
      "Hide risks or costs",
      "Ignore finance feedback",
      "Execute every task itself",
      "Approve expensive changes without review",
    ],
    description:
      "Owns the blueprint, sequencing, and supervision layer so work stays aligned, efficient, and on track.",
  },
  "finance-department": {
    key: "finance-department",
    name: "Finance Department",
    subtitle: "Finance Specialist & Cost Analysis",
    zone: "lounge",
    color: "#f59e0b",
    skills: [
      "token accounting",
      "budget forecasting",
      "model efficiency analysis",
      "daily/weekly spend tracking",
      "cost guardrails",
    ],
    tools: ["Usage Metrics", "Cost Reports", "Model Pricing", "Approvals"],
    responsibilities: [
      "Estimate project cost",
      "Track daily and weekly spend",
      "Recommend cheaper model choices",
      "Flag overspend risks early",
    ],
    canDo: [
      "Analyze job cost line items",
      "Report spend in dollars and tokens",
      "Advise on model selection",
      "Provide daily/weekly recaps",
    ],
    cantDo: [
      "Override human approval policy",
      "Hide spending details",
      "Approve risky budgets silently",
      "Change project scope unilaterally",
    ],
    description:
      "Keeps the office financially honest with cost estimates, spend tracking, and model-efficiency guidance.",
  },
};

export const OFFICE_ROLE_KEY_IDS: Record<OfficeRoleKey, string> = {
  "master-researcher": "agent-researcher",
  "master-coder": "agent-coder",
  "project-manager": "agent-manager",
  "finance-department": "agent-finance",
};

export function isOfficeRoleAgent(agentId: string): OfficeRoleKey | null {
  const lower = agentId.toLowerCase();
  if (lower.includes("research")) return "master-researcher";
  if (lower.includes("coder") || lower.includes("dev")) return "master-coder";
  if (lower.includes("manager") || lower.includes("pm") || lower.includes("architect")) return "project-manager";
  if (lower.includes("finance") || lower.includes("cost")) return "finance-department";
  return null;
}

export const OFFICE_ROLE_ORDER: OfficeRoleKey[] = [
  "master-researcher",
  "master-coder",
  "project-manager",
  "finance-department",
];
