import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveWorkerEndpoints, WorkerEndpointConfigError } from './workerEndpoints.ts';

test('requires the Controller API URL for management boundaries', () => {
  assert.throws(
    () => resolveWorkerEndpoints({ NEXT_PUBLIC_TOWER_API_URL: 'http://localhost:8787' }),
    (error) => error instanceof WorkerEndpointConfigError
      && error.message.includes('Missing NEXT_PUBLIC_CONTROLLER_API_URL'),
  );
});

test('normalizes Controller and Tower URLs and derives Tower sync URL', () => {
  const endpoints = resolveWorkerEndpoints({
    NEXT_PUBLIC_CONTROLLER_API_URL: 'http://localhost:8788/api/',
    NEXT_PUBLIC_TOWER_API_URL: 'http://localhost:8787/',
  });

  assert.equal(endpoints.controllerApiUrl, 'http://localhost:8788/api');
  assert.equal(endpoints.towerApiUrl, 'http://localhost:8787');
  assert.equal(endpoints.towerSyncUrl, 'ws://localhost:8787/app/sync');
});

test('allows an explicit Tower WebSocket URL for Pilot runtime paths', () => {
  const endpoints = resolveWorkerEndpoints({
    NEXT_PUBLIC_CONTROLLER_API_URL: 'https://controller.example.com/api',
    NEXT_PUBLIC_TOWER_API_URL: 'https://tower.example.com',
    NEXT_PUBLIC_TOWER_SYNC_URL: 'wss://sync.example.com/app/sync/',
  });

  assert.equal(endpoints.towerSyncUrl, 'wss://sync.example.com/app/sync');
});

test('rejects runtime HTTP URLs in the Tower WebSocket override', () => {
  assert.throws(
    () => resolveWorkerEndpoints({
      NEXT_PUBLIC_CONTROLLER_API_URL: 'http://localhost:8788/api',
      NEXT_PUBLIC_TOWER_API_URL: 'http://localhost:8787',
      NEXT_PUBLIC_TOWER_SYNC_URL: 'http://localhost:8787/app/sync',
    }),
    (error) => error instanceof WorkerEndpointConfigError
      && error.message.includes('NEXT_PUBLIC_TOWER_SYNC_URL')
      && error.message.includes('ws: or wss:'),
  );
});

