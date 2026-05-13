import assert from 'node:assert/strict';
import test from 'node:test';

import { createWorkflowService } from './workflow.service.ts';
import type { TowerWorkflow } from './workflow.ts';

const sampleWorkflow: TowerWorkflow = {
  id: 'workflow-1',
  name: 'Workflow 1',
  version: 1,
  start: 'start',
  steps: {},
  globals: {},
  config: {
    allowedOrigins: ['http://localhost:3000'],
    secret: 'test-secret',
  },
};

test('routes workflow list requests to Controller', async () => {
  const calls: string[] = [];
  const service = createWorkflowService({
    controllerAdminToken: 'local-test-admin-token',
    controllerApiUrl: 'http://controller.local/api',
    fetcher: async (url) => {
      calls.push(String(url));
      return Response.json({ data: [{ id: 'workflow-1', name: 'Workflow 1' }] });
    },
  });

  const workflows = await service.getWorkflows();

  assert.deepEqual(workflows, [{ id: 'workflow-1', name: 'Workflow 1' }]);
  assert.deepEqual(calls, ['http://controller.local/api/workflows']);
});

test('routes workflow mutations to Controller and preserves generated ids', async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const service = createWorkflowService({
    controllerAdminToken: 'local-test-admin-token',
    controllerApiUrl: 'http://controller.local/api',
    idFactory: () => 'generated-id',
    fetcher: async (url, init) => {
      calls.push({ url: String(url), init });
      return Response.json({ data: { ...sampleWorkflow, id: 'generated-id' } });
    },
  });

  const saved = await service.upsertWorkflow({ ...sampleWorkflow, id: undefined });

  assert.equal(saved.id, 'generated-id');
  assert.equal(calls[0]?.url, 'http://controller.local/api/workflows/generated-id');
  assert.equal(calls[0]?.init?.method, 'PUT');
  assert.deepEqual(calls[0]?.init?.headers, {
    'Content-Type': 'application/json',
    'x-aero-admin-token': 'local-test-admin-token',
  });
  assert.equal(calls[0]?.init?.body, JSON.stringify({ ...sampleWorkflow, id: 'generated-id' }));
});
