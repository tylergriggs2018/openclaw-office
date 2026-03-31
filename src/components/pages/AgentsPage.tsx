import { Bot } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { AgentDetailHeader } from "@/components/console/agents/AgentDetailHeader";
import { AgentDetailTabs } from "@/components/console/agents/AgentDetailTabs";
import { AgentListPanel } from "@/components/console/agents/AgentListPanel";
import { CreateAgentDialog } from "@/components/console/agents/CreateAgentDialog";
import { DeleteAgentDialog } from "@/components/console/agents/DeleteAgentDialog";
import { OFFICE_ROLE_ORDER, OFFICE_ROLES } from "@/lib/agent-office-roles";
import { useAgentsStore } from "@/store/console-stores/agents-store";

export function AgentsPage() {
  const { t } = useTranslation("console");
  const { selectedAgentId, agents, fetchAgents } = useAgentsStore();
  const selectedAgent = agents.find((a) => a.id === selectedAgentId) ?? null;

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("agents.title")}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t("agents.description")}</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <AgentListPanel />

        <div className="min-w-0 space-y-4">
          <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Mission Control Office</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Four specialized agents, each with a distinct operating lane.
                </p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {OFFICE_ROLE_ORDER.map((roleKey) => {
                const role = OFFICE_ROLES[roleKey];
                return (
                  <div key={role.key} className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: role.color }} />
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-gray-100">{role.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{role.subtitle}</div>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{role.description}</p>
                    <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                      <div className="font-medium">Skills:</div>
                      <div>{role.skills.join(" · ")}</div>
                      <div className="mt-2 font-medium">Tools:</div>
                      <div>{role.tools.join(" · ")}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {selectedAgent ? (
            <div className="space-y-4">
              <AgentDetailHeader agent={selectedAgent} />
              <AgentDetailTabs agent={selectedAgent} />
            </div>
          ) : (
            <div className="flex h-96 flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
              <Bot className="mb-3 h-12 w-12 text-gray-300 dark:text-gray-600" />
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {t("agents.selectAgent")}
              </p>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                {t("agents.selectAgentDesc")}
              </p>
            </div>
          )}
        </div>
      </div>

      <CreateAgentDialog />
      <DeleteAgentDialog />
    </div>
  );
}
