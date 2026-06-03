import { getControllerApiUrl } from '../../../../libs/config/workerEndpoints.ts';

export interface RunnerWorkflowConfig {
  secret: string;
}

export interface RunnerWorkflow {
  config: RunnerWorkflowConfig;
  id?: string;
  name: string;
}

export interface RunnerWorkflowMetadata {
  id: string;
  name: string;
}

interface WorkflowReaderOptions {
  controllerApiUrl?: string;
  fetcher?: typeof fetch;
}

export function createRunnerWorkflowReader({
  controllerApiUrl,
  fetcher = fetch,
}: WorkflowReaderOptions = {}) {
  const getBaseUrl = () => controllerApiUrl ?? getControllerApiUrl();

  return {
    async getWorkflows(): Promise<RunnerWorkflowMetadata[]> {
      const response = await fetcher(`${getBaseUrl()}/workflows`, { credentials: 'include' });
      return readControllerData<RunnerWorkflowMetadata[]>(
        response,
        'Failed to fetch workflows from Controller',
      );
    },

    async getWorkflowById(id: string): Promise<RunnerWorkflow> {
      const response = await fetcher(`${getBaseUrl()}/workflows/${encodeURIComponent(id)}`, { credentials: 'include' });
      return readControllerData<RunnerWorkflow>(
        response,
        `Failed to fetch workflow ${id} from Controller`,
      );
    },
  };
}

export const runnerWorkflowReader = createRunnerWorkflowReader();

async function readControllerData<TValue>(
  response: Response,
  errorMessage: string,
): Promise<TValue> {
  if (!response.ok) throw new Error(errorMessage);

  const payload: unknown = await response.json();
  if (!payload || typeof payload !== 'object' || !('data' in payload)) {
    throw new Error(`${errorMessage}: invalid Controller response envelope`);
  }

  return (payload as { data: TValue }).data;
}
