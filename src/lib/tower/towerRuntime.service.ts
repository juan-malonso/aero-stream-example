import { getTowerApiUrl, getTowerSyncUrl, type WorkerEndpointEnv } from '../config/workerEndpoints.ts';

interface TowerRuntimeServiceOptions {
  towerApiUrl?: string;
  fetcher?: typeof fetch;
}

export interface CreateSessionResponse {
  sessionId?: string;
}

export function createTowerRuntimeService({ towerApiUrl, fetcher = fetch }: TowerRuntimeServiceOptions = {}) {
  const getBaseUrl = () => towerApiUrl ?? getTowerApiUrl();

  return {
    async createSession(workflowId: string): Promise<CreateSessionResponse> {
      const response = await fetcher(`${getBaseUrl()}/app/${encodeURIComponent(workflowId)}`, { method: 'POST' });
      if (!response.ok) {
        throw new Error(`Unable to create Tower runtime session: ${response.status}`);
      }

      return await response.json() as CreateSessionResponse;
    },
  };
}

export function getPilotSyncUrl(env?: WorkerEndpointEnv): string {
  return getTowerSyncUrl(env);
}

export const towerRuntimeService = createTowerRuntimeService();

