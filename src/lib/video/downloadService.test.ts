import assert from 'node:assert/strict';
import test from 'node:test';

process.env.NEXT_PUBLIC_CONTROLLER_API_URL = 'http://controller.local/api';
process.env.NEXT_PUBLIC_TOWER_API_URL = 'http://tower.local';

const { getVideoUrl } = await import('./downloadService.ts');

test('routes video preview and download URLs to Controller', () => {
  assert.equal(
    getVideoUrl('session 1', 'connection/1'),
    'http://controller.local/api/videos/session%201/connection%2F1',
  );

  assert.equal(
    getVideoUrl('session 1', 'connection/1', true),
    'http://controller.local/api/videos/session%201/connection%2F1?download=1',
  );
});

