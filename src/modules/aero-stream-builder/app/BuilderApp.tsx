import { WorkflowBuilder } from '@/modules/aero-stream-builder/components/WorkflowBuilder';
import { WorkflowProvider } from '@/modules/aero-stream-builder/lib/workflow/provider/WorkflowContext';

export function BuilderApp() {
  return (
    <WorkflowProvider>
      <WorkflowBuilder />
    </WorkflowProvider>
  );
}
