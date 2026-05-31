import type { StepNodeData } from '@/aero-stream-example-library';

import { formatDisplayValue } from '../../shared/display.ts';

import { isRecord, readPath } from './runtimeValues.ts';

export interface PreviewCodeHelpers {
  fetchJson: (url: string, init?: RequestInit) => Promise<unknown>;
  get: (path: string, fallback?: unknown) => unknown;
  map: (
    source: unknown,
    mappings: { input: string; output: string }[] | string,
  ) => Record<string, unknown>;
}

export function formatStepCodeSource(source: string): string {
  const normalizedSource = source.replace(/\r\n?/g, '\n').trim();
  if (normalizedSource.length === 0) return '';

  let indentLevel = 0;
  return normalizedSource
    .split('\n')
    .map((line) => {
      const trimmedLine = line.trim();
      if (trimmedLine.length === 0) return '';

      if (/^[}\])]/.test(trimmedLine)) {
        indentLevel = Math.max(0, indentLevel - 1);
      }

      const formattedLine = `${'  '.repeat(indentLevel)}${trimmedLine}`;
      if (/[{[(]\s*(?:\/\/.*)?$/.test(trimmedLine)) indentLevel += 1;
      return formattedLine;
    })
    .join('\n');
}

export async function executePreviewCode({
  inputValue,
  source,
  stepData,
}: {
  inputValue: Record<string, unknown>;
  source: string;
  stepData: StepNodeData;
}): Promise<unknown> {
  const entrypoint = stepData.code?.entrypoint ?? 'run';
  const previewContext = {
    data: inputValue,
    props: inputValue,
    step: stepData,
    steps: isRecord(inputValue.steps) ? inputValue.steps : {},
  };

  const executableSource = source.replaceAll(/\bexport\s+/g, '');

  // Demo preview boundary only. Keep dynamic execution isolated here for future Worker/sandbox replacement.
  // eslint-disable-next-line @typescript-eslint/no-implied-eval -- Builder preview runtime.
  const factory = new Function(
    'ctx',
    'helpers',
    [
      '"use strict";',
      'const exports = {};',
      'const module = { exports };',
      executableSource,
      `const entrypointFn = typeof ${entrypoint} === "function"`,
      `  ? ${entrypoint}`,
      `  : module.exports?.${entrypoint} ?? exports.${entrypoint};`,
      'if (typeof entrypointFn !== "function") {',
      `  throw new Error("Dynamic step entrypoint '${entrypoint}' was not found");`,
      '}',
      'return Promise.resolve(entrypointFn(ctx, helpers));',
    ].join('\n'),
  ) as (context: unknown, helpers: PreviewCodeHelpers) => unknown;

  return factory(previewContext, createPreviewCodeHelpers(previewContext));
}

export function createPreviewCodeHelpers(state: Record<string, unknown>): PreviewCodeHelpers {
  return {
    fetchJson: async (url, init) => {
      const response = await fetch(url, init);
      if (!response.ok) {
        throw new Error(`fetchJson failed ${response.status} ${response.statusText}`);
      }

      return response.json() as Promise<unknown>;
    },
    get: (path, fallback) => readPath(state, path.split('.')) ?? fallback,
    map: (source, mappings) => {
      const output: Record<string, unknown> = {};
      const input = isRecord(source) ? source : {};
      for (const pair of parsePreviewMappings(mappings)) {
        output[pair.output] = readPath(input, pair.input.split('.'));
      }

      return output;
    },
  };
}

export function normalizePreviewCodeResult(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) {
    return {
      data: {},
      status: value == null ? 'success' : formatDisplayValue(value),
    };
  }

  if ('result' in value) return normalizePreviewCodeResult(value.result);

  const status = typeof value.status === 'string' ? value.status : 'success';
  const data = isRecord(value.data) ? value.data : previewDataFromRecord(value);
  return { status, data };
}

export function formatPreviewCodeError(error: unknown): string {
  if (error instanceof Error) return error.stack ?? error.message;
  if (typeof error === 'string') return error;

  try {
    return JSON.stringify(error, null, 2);
  } catch {
    return 'Unknown preview code error';
  }
}

function parsePreviewMappings(
  value: { input: string; output: string }[] | string,
): { input: string; output: string }[] {
  if (typeof value !== 'string') return value;

  return value.split(',')
    .map(pair => pair.trim())
    .filter(Boolean)
    .map((pair) => {
      const [input, output] = pair.split(':').map(part => part.trim());
      return input && output ? { input, output } : null;
    })
    .filter((pair): pair is { input: string; output: string } => pair !== null);
}

function previewDataFromRecord(value: Record<string, unknown>): Record<string, unknown> {
  if ('data' in value && !isRecord(value.data)) return { value: value.data };

  const data = { ...value };
  delete data.status;
  return data;
}
