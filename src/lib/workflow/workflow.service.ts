import { type TowerWorkflow, type WorkflowMetadata } from './workflow.ts';
import { getControllerAdminHeaders, getControllerApiUrl } from '../config/workerEndpoints.ts';

interface WorkflowServiceOptions {
  controllerAdminToken?: string;
  controllerApiUrl?: string;
  fetcher?: typeof fetch;
  idFactory?: () => string;
}

export function createWorkflowService({
  controllerAdminToken,
  controllerApiUrl,
  fetcher = fetch,
  idFactory = () => crypto.randomUUID(),
}: WorkflowServiceOptions = {}) {
  const getBaseUrl = () => controllerApiUrl ?? getControllerApiUrl();
  const headers = () => controllerAdminToken
    ? { 'x-aero-admin-token': controllerAdminToken }
    : getControllerAdminHeaders();

  return {
    async getWorkflows(): Promise<WorkflowMetadata[]> {
      const res = await fetcher(`${getBaseUrl()}/workflows`, { headers: headers() });
      if (!res.ok) throw new Error('Failed to fetch workflows from Controller');
      const { data } = await res.json();
      return data;
    },

    async getWorkflowById(id: string): Promise<TowerWorkflow> {
      const res = await fetcher(`${getBaseUrl()}/workflows/${encodeURIComponent(id)}`, { headers: headers() });
      if (!res.ok) throw new Error(`Failed to fetch workflow ${id} from Controller`);
      const { data } = await res.json();
      return data;
    },

    async upsertWorkflow(workflow: TowerWorkflow): Promise<TowerWorkflow> {
      const id = workflow.id || idFactory();
      const res = await fetcher(`${getBaseUrl()}/workflows/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { ...headers(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...workflow, id }),
      });
      if (!res.ok) throw new Error('Failed to save workflow through Controller');
      const { data } = await res.json();
      return data;
    },

    async deleteWorkflow(id: string): Promise<void> {
      const res = await fetcher(`${getBaseUrl()}/workflows/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: headers(),
      });
      if (!res.ok) throw new Error(`Failed to delete workflow ${id} through Controller`);
    },
  };
}

export const workflowService = createWorkflowService();
