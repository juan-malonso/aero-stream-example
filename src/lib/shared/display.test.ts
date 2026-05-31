import assert from 'node:assert/strict';
import test from 'node:test';

import { formatDisplayValue } from './display.ts';

test('formats scalar display values safely', () => {
  assert.equal(formatDisplayValue('Aero'), 'Aero');
  assert.equal(formatDisplayValue(42), '42');
  assert.equal(formatDisplayValue(false), 'false');
  assert.equal(formatDisplayValue(null), '—');
});

test('formats object display values as JSON', () => {
  assert.equal(formatDisplayValue({ status: 'ok' }), '{"status":"ok"}');
});
