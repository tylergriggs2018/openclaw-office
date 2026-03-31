/**
 * Finance / Cost Analysis for the Agent Office
 *
 * Provides token and dollar estimates per step and model.
 * All costs are computed locally — no external API calls.
 */

import type { OfficeRoleKey } from "@/lib/agent-office-roles";
import { OFFICE_ROLES } from "@/lib/agent-office-roles";
import type { CostLineItem, HandoffStep, WorkflowState } from "./agent-workflow";

/** Estimated cost per 1M tokens (input + output combined) */
export const MODEL_COST_PER_1M_TOKENS: Record<string, number> = {
  // Cloud — approximate list pricing (USD)
  "anthropic/claude-3-5-sonnet": 15,
  "anthropic/claude-3-5-haiku": 1.5,
  "openai/gpt-4o": 15,
  "openai/gpt-4o-mini": 0.6,
  "google/gemini-1-5-pro": 7,
  "google/gemini-1-5-flash": 0.35,
  "x-ai/grok-3": 10,
  "mistral/mistral-large": 8,
  "local/qwen2.5": 0,           // free, local
  "local/llama3.2": 0,          // free, local
  "local/gemma3": 0,            // free, local
  "myclaw/gpt-5.4-mini": 0.6,  // your configured default
};

/** Default model used when no specific model is selected */
export const DEFAULT_MODEL = "myclaw/gpt-5.4-mini";

/** Average tokens per step estimate (input + output) */
export const STEP_TOKEN_ESTIMATES: Record<HandoffStep, { input: number; output: number }> = {
  intake:       { input: 500,    output: 300 },
  research:     { input: 2000,   output: 800 },
  plan:         { input: 3000,   output: 1500 },
  cost_analysis:{ input: 1500,   output: 500 },
  approval:     { input: 600,    output: 200 },
  execution:    { input: 5000,   output: 3000 },
  verification: { input: 2000,   output: 1000 },
  delivery:     { input: 800,    output: 400 },
};

/** Default agent per step */
export const STEP_DEFAULT_AGENT: Record<HandoffStep, OfficeRoleKey> = {
  intake: "project-manager",
  research: "master-researcher",
  plan: "project-manager",
  cost_analysis: "finance-department",
  approval: "project-manager",
  execution: "master-coder",
  verification: "master-coder",
  delivery: "project-manager",
};

export interface CostEstimate {
  step: HandoffStep;
  agent: OfficeRoleKey;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costPerM: number;
  estimatedDollars: number;
  rationale: string;
}

export function estimateStepCost(
  step: HandoffStep,
  agent: OfficeRoleKey,
  model?: string,
): CostEstimate {
  const modelKey = model ?? DEFAULT_MODEL;
  const costPerM = MODEL_COST_PER_1M_TOKENS[modelKey] ?? 0.60;
  const tokens = STEP_TOKEN_ESTIMATES[step];
  const totalTokens = tokens.input + tokens.output;
  const estimatedDollars = (totalTokens / 1_000_000) * costPerM;

  const rationale = buildRationale(step, agent, totalTokens, costPerM);

  return {
    step,
    agent,
    model: modelKey,
    inputTokens: tokens.input,
    outputTokens: tokens.output,
    totalTokens,
    costPerM,
    estimatedDollars,
    rationale,
  };
}

function buildRationale(
  step: HandoffStep,
  agent: OfficeRoleKey,
  totalTokens: number,
  costPerM: number,
): string {
  const role = OFFICE_ROLES[agent]?.name ?? agent;
  const isFree = costPerM === 0;
  if (isFree) {
    return `${role} uses a free local model — ${totalTokens.toLocaleString()} tokens estimated, no cost.`;
  }
  return `${role} uses ${costPerM > 0 ? `$${costPerM}/1M tokens` : "free model"} — ${totalTokens.toLocaleString()} tokens = ~$${estimatedDollars(costPerM, totalTokens).toFixed(4)} estimated.`;
}

function estimatedDollars(costPerM: number, totalTokens: number): number {
  return (totalTokens / 1_000_000) * costPerM;
}

export function estimateWorkflowCost(
  steps: HandoffStep[],
  agentAssignments?: Partial<Record<HandoffStep, OfficeRoleKey>>,
): CostEstimate[] {
  return steps.map((step) => {
    const agent = agentAssignments?.[step] ?? STEP_DEFAULT_AGENT[step];
    return estimateStepCost(step, agent);
  });
}

export function formatCost(dollars: number): string {
  if (dollars === 0) return "free";
  if (dollars < 0.01) return `$${dollars.toFixed(4)}`;
  if (dollars < 1) return `$${dollars.toFixed(3)}`;
  return `$${dollars.toFixed(2)}`;
}

export function formatTokens(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export function buildCostSummary(estimates: CostEstimate[]): {
  totalDollars: number;
  totalTokens: number;
  freeSteps: number;
  summary: string;
} {
  const totalDollars = estimates.reduce((s, e) => s + e.estimatedDollars, 0);
  const totalTokens = estimates.reduce((s, e) => s + e.totalTokens, 0);
  const freeSteps = estimates.filter((e) => e.costPerM === 0).length;

  const summary = estimates
    .map((e) => {
      const cost = formatCost(e.estimatedDollars);
      return `${e.step}: ${cost}`;
    })
    .join(" · ");

  return { totalDollars, totalTokens, freeSteps, summary };
}
