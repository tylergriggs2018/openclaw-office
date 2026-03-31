import { FloorPlan } from "@/components/office-2d/FloorPlan";
import { WorkflowPanel } from "@/components/office/WorkflowPanel";
import { useOfficeStore } from "@/store/office-store";

export function OfficeView() {
  const workflowPanelOpen = useOfficeStore((s) => s.workflowPanelOpen);

  if (workflowPanelOpen) {
    return (
      <div className="flex h-full w-full">
        <div className="h-full flex-1">
          <FloorPlan />
        </div>
        <div className="h-full w-[420px] shrink-0 overflow-hidden border-l border-gray-200 dark:border-gray-800">
          <WorkflowPanel />
        </div>
      </div>
    );
  }

  return <FloorPlan />;
}
