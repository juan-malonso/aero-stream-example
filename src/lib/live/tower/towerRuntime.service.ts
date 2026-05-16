import { getTowerInitUrl, getTowerLiveUrl, type WorkerEndpointEnv } from '../../shared/config/workerEndpoints.ts';

interface TowerRuntimeServiceOptions {
  towerInitUrl?: string;
  fetcher?: typeof fetch;
}

export interface CreateSessionResponse {
  sessionId?: string;
}

export function createTowerRuntimeService({ towerInitUrl, fetcher = fetch }: TowerRuntimeServiceOptions = {}) {
  const getInitUrl = () => towerInitUrl ?? getTowerInitUrl();

  return {
    async createSession(workflowId: string): Promise<CreateSessionResponse> {
      const response = await fetcher(getInitUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflowId }),
      });
      if (!response.ok) {
        throw new Error(`Unable to create Tower runtime session: ${response.status}`);
      }

      return await response.json() as CreateSessionResponse;
    },
  };
}

export function getPilotLiveUrl(env?: WorkerEndpointEnv): string {
  return getTowerLiveUrl(env);
}

export const towerRuntimeService = createTowerRuntimeService();
