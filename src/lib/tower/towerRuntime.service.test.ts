import assert from 'node:assert/strict';
import test from 'node:test';

import { createTowerRuntimeService, getPilotSyncUrl } from './towerRuntime.service.ts';

test('creates runtime sessions through Tower', async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const service = createTowerRuntimeService({
    towerApiUrl: 'http://tower.local',
    fetcher: async (url, init) => {
      calls.push({ url: String(url), init });
      return Response.json({ sessionId: '3f8de11b-7ab7-4381-839f-459dcb00e738' });
    },
  });

  const data = await service.createSession('workflow 1');

  assert.equal(data.sessionId, '3f8de11b-7ab7-4381-839f-459dcb00e738');
  assert.equal(calls[0]?.url, 'http://tower.local/app/workflow%201');
  assert.equal(calls[0]?.init?.method, 'POST');
});

test('derives the Pilot sync URL from Tower config', () => {
  assert.equal(
    getPilotSyncUrl({
      NEXT_PUBLIC_CONTROLLER_API_URL: 'http://controller.local/api',
      NEXT_PUBLIC_TOWER_API_URL: 'https://tower.local',
    }),
    'wss://tower.local/app/sync',
  );
});
