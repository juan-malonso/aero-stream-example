import assert from 'node:assert/strict';
import test from 'node:test';

import { createTowerRuntimeService, getPilotLiveUrl } from './towerRuntime.service.ts';

test('creates runtime sessions through Tower', async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const service = createTowerRuntimeService({
    towerInitUrl: 'http://tower.local/squawk/init',
    fetcher: async (url, init) => {
      calls.push({ url: String(url), init });
      return Response.json({ sessionId: '3f8de11b-7ab7-4381-839f-459dcb00e738' });
    },
  });

  const data = await service.createSession('workflow 1');

  assert.equal(data.sessionId, '3f8de11b-7ab7-4381-839f-459dcb00e738');
  assert.equal(calls[0]?.url, 'http://tower.local/squawk/init');
  assert.equal(calls[0]?.init?.method, 'POST');
  assert.deepEqual(JSON.parse(String(calls[0]?.init?.body)), { workflowId: 'workflow 1' });
});

test('reads the Pilot live URL from Tower config', () => {
  assert.equal(
    getPilotLiveUrl({
      NEXT_PUBLIC_CONTROLLER_API_URL: 'http://controller.local/api',
      NEXT_PUBLIC_TOWER_INIT_URL: 'https://tower.local/squawk/init',
      NEXT_PUBLIC_TOWER_LIVE_URL: 'wss://tower.local/squawk/live',
    }),
    'wss://tower.local/squawk/live',
  );
});
