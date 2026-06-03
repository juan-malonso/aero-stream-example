import { getControllerApiUrl } from '../../../../libs/config/workerEndpoints.ts';

import { isRecord } from './runtimeValues.ts';
import { type TowerWorkflow, type WorkflowMetadata } from './workflow.ts';

interface WorkflowServiceOptions {
  controllerApiUrl?: string;
  fetcher?: typeof fetch;
  idFactory?: () => string;
}

export function createWorkflowService({
  controllerApiUrl,
  fetcher = fetch,
  idFactory = () => crypto.randomUUID(),
}: WorkflowServiceOptions = {}) {
  const getBaseUrl = () => controllerApiUrl ?? getControllerApiUrl();

  return {
    async getWorkflows(): Promise<WorkflowMetadata[]> {
      const response = await fetcher(`${getBaseUrl()}/workflows`, { credentials: 'include' });
      return readControllerData<WorkflowMetadata[]>(
        response,
        'Failed to fetch workflows from Controller',
      );
    },

    async getWorkflowById(id: string): Promise<TowerWorkflow> {
      const response = await fetcher(`${getBaseUrl()}/workflows/${encodeURIComponent(id)}`, { credentials: 'include' });
      return readControllerData<TowerWorkflow>(
        response,
        `Failed to fetch workflow ${id} from Controller`,
      );
    },

    async upsertWorkflow(workflow: TowerWorkflow): Promise<TowerWorkflow> {
      const id = workflow.id ?? idFactory();
      const response = await fetcher(`${getBaseUrl()}/workflows/${encodeURIComponent(id)}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...workflow, id }),
      });
      return readControllerData<TowerWorkflow>(
        response,
        'Failed to save workflow through Controller',
      );
    },

    async deleteWorkflow(id: string): Promise<void> {
      const response = await fetcher(`${getBaseUrl()}/workflows/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error(`Failed to delete workflow ${id} through Controller`);
    },
  };
}

export const workflowService = createWorkflowService();

async function readControllerData<TValue>(
  response: Response,
  errorMessage: string,
): Promise<TValue> {
  if (!response.ok) throw new Error(errorMessage);

  const payload: unknown = await response.json();
  if (!isRecord(payload) || !('data' in payload)) {
    throw new Error(`${errorMessage}: invalid Controller response envelope`);
  }

  return payload.data as TValue;
}
