import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useWorkflowStore } from "@/store/workflow-store";
import { useOfficeStore } from "@/store/office-store";
import { HANDOFF_SEQUENCE, STEP_TO_ROLE, stepLabel } from "@/lib/agent-workflow";
import {
  estimateWorkflowCost,
  buildCostSummary,
  formatCost,
  formatTokens,
  DEFAULT_MODEL,
} from "@/lib/agent-costing";
import { OFFICE_ROLES, OFFICE_ROLE_ORDER } from "@/lib/agent-office-roles";

export function WorkflowPanel() {
  const { t } = useTranslation();
  const { workflows, selectedProjectId, draftPayload, createWorkflow, selectProject, updateDraft, clearDraft, completeHandoff, cancelWorkflow } = useWorkflowStore();
  const [newProjectName, setNewProjectName] = useState("");
  const [newGoal, setNewGoal] = useState("");

  const selected = selectedProjectId ? workflows[selectedProjectId] : null;
  const projectList = Object.values(workflows);

  function handleCreate() {
    if (!newProjectName.trim() || !newGoal.trim()) return;
    createWorkflow(newProjectName.trim(), newGoal.trim());
    setNewProjectName("");
    setNewGoal("");
    clearDraft();
  }

  function handleStartWorkflow() {
    if (!draftPayload?.goal) return;
    createWorkflow(draftPayload.projectName ?? "Untitled Project", draftPayload.goal);
  }

  const costEstimates = selected
    ? estimateWorkflowCost(
        HANDOFF_SEQUENCE,
        HANDOFF_SEQUENCE.reduce(
          (acc, step) => ({ ...acc, [step]: STEP_TO_ROLE[step] === "human" ? "project-manager" : STEP_TO_ROLE[step] }),
          {} as any,
        ),
      )
    : [];

  const costSummary = buildCostSummary(costEstimates);

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Mission Control
        </h2>
        <span className="text-sm text-gray-500">
          {projectList.filter((w) => w.status === "active").length} active project
          {projectList.filter((w) => w.status === "active").length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="flex gap-4 flex-1 overflow-hidden">
        {/* Sidebar: project list + new project form */}
        <div className="w-72 space-y-3 overflow-y-auto">
          {/* New project form */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
              Start New Project
            </h3>
            <input
              type="text"
              placeholder="Project name"
              value={newProjectName}
              onChange={(e) => {
                setNewProjectName(e.target.value);
                updateDraft({ projectName: e.target.value });
              }}
              className="mb-2 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
            <textarea
              placeholder="What are you trying to accomplish?"
              value={newGoal}
              onChange={(e) => {
                setNewGoal(e.target.value);
                updateDraft({ goal: e.target.value });
              }}
              rows={3}
              className="mb-3 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
            <button
              onClick={handleCreate}
              disabled={!newProjectName.trim() || !newGoal.trim()}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Launch Project
            </button>
          </div>

          {/* Active projects */}
          <div className="space-y-2">
            {projectList.length === 0 && (
              <p className="text-sm text-gray-400">No projects yet.</p>
            )}
            {projectList.map((wf) => (
              <button
                key={wf.projectId}
                onClick={() => selectProject(wf.projectId)}
                className={`w-full rounded-xl border p-3 text-left text-sm transition ${
                  wf.projectId === selectedProjectId
                    ? "border-blue-400 bg-blue-50 dark:bg-blue-900/30"
                    : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900 dark:text-gray-100">{wf.projectName}</span>
                  <span
                    className={`text-xs ${
                      wf.status === "active"
                        ? "text-green-600"
                        : wf.status === "paused"
                          ? "text-yellow-600"
                          : "text-gray-400"
                    }`}
                  >
                    {wf.status}
                  </span>
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  {stepLabel(wf.currentStep)} · {formatCost(wf.totalCostEstimate)} est.
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main: workflow detail */}
        <div className="flex-1 overflow-y-auto">
          {!selected ? (
            <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
              <p className="text-sm text-gray-400">Select a project or start a new one.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Project header */}
              <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                      {selected.projectName}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">{selected.goal}</p>
                  </div>
                  <div className="flex gap-2">
                    {selected.status === "active" && (
                      <button
                        onClick={() => cancelWorkflow(selected.projectId)}
                        className="rounded-lg border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:border-red-300 hover:text-red-500 dark:border-gray-600 dark:text-gray-400"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                {/* Cost summary bar */}
                <div className="mt-4 flex items-center gap-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                  <div>
                    <div className="text-xs font-medium text-gray-500">Estimated Total</div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {formatCost(costSummary.totalDollars)}
                    </div>
                  </div>
                  <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />
                  <div>
                    <div className="text-xs font-medium text-gray-500">Tokens</div>
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      {formatTokens(costSummary.totalTokens)}
                    </div>
                  </div>
                  <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />
                  <div>
                    <div className="text-xs font-medium text-gray-500">Free Steps</div>
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      {costSummary.freeSteps} / {costSummary.summary.split(" · ").length}
                    </div>
                  </div>
                </div>
              </div>

              {/* Step pipeline */}
              <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
                <h4 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Workflow Pipeline
                </h4>
                <div className="space-y-3">
                  {HANDOFF_SEQUENCE.map((step, idx) => {
                    const isComplete =
                      idx <
                      HANDOFF_SEQUENCE.indexOf(selected.currentStep);
                    const isCurrent = step === selected.currentStep;
                    const isPending =
                      idx >
                      HANDOFF_SEQUENCE.indexOf(selected.currentStep);
                    const assignee = STEP_TO_ROLE[step];
                    const cost = costEstimates[idx];
                    const roleName =
                      assignee === "human"
                        ? "Human"
                        : OFFICE_ROLES[assignee]?.name ?? assignee;

                    return (
                      <div
                        key={step}
                        className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition ${
                          isComplete
                            ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
                            : isCurrent
                              ? "border-blue-400 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20"
                              : "border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/30"
                        }`}
                      >
                        {/* Step number */}
                        <div
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                            isComplete
                              ? "bg-green-500 text-white"
                              : isCurrent
                                ? "bg-blue-500 text-white"
                                : "bg-gray-200 text-gray-500 dark:bg-gray-700"
                          }`}
                        >
                          {isComplete ? "✓" : idx + 1}
                        </div>

                        {/* Step info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {stepLabel(step)}
                            </span>
                            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500 dark:bg-gray-700">
                              {roleName}
                            </span>
                          </div>
                          {cost && (
                            <div className="mt-0.5 text-xs text-gray-400">
                              ~{formatTokens(cost.totalTokens)} tokens ·{" "}
                              {formatCost(cost.estimatedDollars)}
                            </div>
                          )}
                        </div>

                        {/* Status badge */}
                        {isComplete && (
                          <span className="text-xs font-medium text-green-600">Done</span>
                        )}
                        {isCurrent && (
                          <span className="text-xs font-medium text-blue-600">Active</span>
                        )}
                        {isPending && (
                          <span className="text-xs text-gray-400">Pending</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Role cards */}
              <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
                <h4 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Office Agents
                </h4>
                <div className="grid gap-3 md:grid-cols-2">
                  {OFFICE_ROLE_ORDER.map((roleKey) => {
                    const role = OFFICE_ROLES[roleKey];
                    const assignedStep = HANDOFF_SEQUENCE.find(
                      (s) => STEP_TO_ROLE[s] === roleKey,
                    );
                    return (
                      <div
                        key={role.key}
                        className="rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: role.color }}
                          />
                          <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
                            {role.name}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">{role.subtitle}</p>
                        {assignedStep && (
                          <div className="mt-2 text-xs text-gray-400">
                            Owns: {stepLabel(assignedStep)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
