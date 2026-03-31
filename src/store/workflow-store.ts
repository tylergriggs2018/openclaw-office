/**
 * Workflow State Store
 *
 * Tracks active project workflows through the office handoff sequence.
 * Uses zustand with immer for immutable updates.
 */

import { enableMapSet } from "immer";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import {
  HANDOFF_SEQUENCE,
  STEP_TO_ROLE,
  REQUIRES_APPROVAL,
  createWorkflow,
  nextStep,
  stepLabel,
  roleLabel,
  type WorkflowState,
  type HandoffRecord,
  type HandoffStep,
  type HandoffPayload,
  type CostLineItem,
} from "@/lib/agent-workflow";
import {
  estimateWorkflowCost,
  buildCostSummary,
  formatCost,
  formatTokens,
  DEFAULT_MODEL,
  type CostEstimate,
} from "@/lib/agent-costing";
import type { OfficeRoleKey } from "@/lib/agent-office-roles";

interface WorkflowStoreState {
  /** All active/complete workflows, keyed by projectId */
  workflows: Record<string, WorkflowState>;

  /** Currently selected projectId in the UI */
  selectedProjectId: string | null;

  /** Draft payload being built for a new project */
  draftPayload: Partial<HandoffPayload> | null;
}

interface WorkflowStore extends WorkflowStoreState {
  /** Create a new workflow from a goal */
  createWorkflow: (projectName: string, goal: string) => WorkflowState;

  /** Advance a workflow to the next step after current handoff is approved */
  advanceWorkflow: (projectId: string) => HandoffStep | null;

  /** Record a handoff completion and update cost tracking */
  completeHandoff: (
    projectId: string,
    step: HandoffStep,
    payload: HandoffPayload,
    approvedBy?: string,
  ) => void;

  /** Block a handoff with a reason */
  blockHandoff: (projectId: string, step: HandoffStep, reason: string) => void;

  /** Unblock a handoff */
  unblockHandoff: (projectId: string, step: HandoffStep) => void;

  /** Get cost estimate for all remaining steps in a workflow */
  getRemainingCost: (projectId: string, assignments?: Partial<Record<HandoffStep, OfficeRoleKey>>) => CostEstimate[];

  /** Get full cost summary for a workflow */
  getWorkflowCostSummary: (projectId: string) => ReturnType<typeof buildCostSummary>;

  /** Select a project in the UI */
  selectProject: (projectId: string | null) => void;

  /** Update draft payload fields */
  updateDraft: (patch: Partial<HandoffPayload>) => void;
  clearDraft: () => void;

  /** Cancel or pause a workflow */
  cancelWorkflow: (projectId: string) => void;
}

export const useWorkflowStore = create<WorkflowStore>()(
  immer((set, get) => ({
    workflows: {},
    selectedProjectId: null,
    draftPayload: null,

    createWorkflow: (projectName, goal) => {
      const projectId = `proj-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const wf = createWorkflow(projectId, projectName, goal);
      set((state) => {
        state.workflows[projectId] = wf;
        state.selectedProjectId = projectId;
      });
      return wf;
    },

    advanceWorkflow: (projectId) => {
      const wf = get().workflows[projectId];
      if (!wf) return null;
      const next = nextStep(wf.currentStep);
      if (!next) return null;
      set((state) => {
        state.workflows[projectId].currentStep = next;
        state.workflows[projectId].updatedAt = Date.now();
      });
      return next;
    },

    completeHandoff: (projectId, step, payload, approvedBy) => {
      const fromRole = STEP_TO_ROLE[step] as OfficeRoleKey;
      const next = nextStep(step);
      set((state) => {
        const wf = state.workflows[projectId];
        if (!wf) return;
        const record: HandoffRecord = {
          id: `${projectId}-${step}-${Date.now()}`,
          step,
          status: "completed",
          from: fromRole as OfficeRoleKey,
          to: next ? (STEP_TO_ROLE[next] as OfficeRoleKey) : fromRole,
          payload,
          costAtHandoff: payload.costEstimate,
          approvedBy,
          approvedAt: approvedBy ? Date.now() : undefined,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        wf.handovers.push(record);
        if (next) wf.currentStep = next;
        wf.updatedAt = Date.now();
      });
    },

    blockHandoff: (projectId, step, reason) => {
      set((state) => {
        const wf = state.workflows[projectId];
        if (!wf) return;
        const existing = wf.handovers.find((h) => h.step === step && h.status === "pending");
        if (existing) {
          existing.status = "blocked";
          existing.blockedReason = reason;
        }
        wf.updatedAt = Date.now();
      });
    },

    unblockHandoff: (projectId, step) => {
      set((state) => {
        const wf = state.workflows[projectId];
        if (!wf) return;
        const existing = wf.handovers.find((h) => h.step === step && h.status === "blocked");
        if (existing) {
          existing.status = "pending";
          existing.blockedReason = undefined;
        }
        wf.updatedAt = Date.now();
      });
    },

    getRemainingCost: (projectId, assignments) => {
      const wf = get().workflows[projectId];
      if (!wf) return [];
      const currentIdx = HANDOFF_SEQUENCE.indexOf(wf.currentStep);
      const remaining = HANDOFF_SEQUENCE.slice(currentIdx);
      return estimateWorkflowCost(remaining, assignments);
    },

    getWorkflowCostSummary: (projectId) => {
      const estimates = get().getRemainingCost(projectId);
      return buildCostSummary(estimates);
    },

    selectProject: (projectId) => {
      set((state) => {
        state.selectedProjectId = projectId;
      });
    },

    updateDraft: (patch) => {
      set((state) => {
        state.draftPayload = { ...state.draftPayload, ...patch };
      });
    },

    clearDraft: () => {
      set((state) => {
        state.draftPayload = null;
      });
    },

    cancelWorkflow: (projectId) => {
      set((state) => {
        if (state.workflows[projectId]) {
          state.workflows[projectId].status = "cancelled";
          state.workflows[projectId].updatedAt = Date.now();
        }
      });
    },
  })),
);
