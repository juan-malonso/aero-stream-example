export interface BindingTextRange {
  end: number;
  start: number;
}

export interface BindingStepOption {
  fields: readonly string[];
  id: string;
}

export interface StepResultBinding {
  path: string[];
  pathText: string;
  stepId: string;
}

export type BindingBrowserPane = 'envs' | 'root' | 'steps';

export interface BindingBrowserTarget {
  pane: BindingBrowserPane;
  stepId: string | undefined;
}

const COMPLETE_BINDING_PATTERN = /^\{\{[^{}\s]+(?:\.[^{}\s]+)*\}\}$/;
const FULL_STEP_RESULT_BINDING_PATTERN = /^\{\{steps\.([^.{}]+)\.result(?:\.([^{}]+))?\}\}$/;
const STEP_RESULT_BINDING_PATTERN = /\{\{steps\.([^.{}]+)\.result(?:\.([^{}]+))?\}\}/;

export function formatStepResultBinding(stepId: string, path?: string): string {
  return path && path.length > 0
    ? `{{steps.${stepId}.result.${path}}}`
    : `{{steps.${stepId}.result}}`;
}

export function parseStepResultBinding(value: string): StepResultBinding | undefined {
  const match = FULL_STEP_RESULT_BINDING_PATTERN.exec(value);
  if (!match) return undefined;

  const pathText = match[2] ?? '';
  return {
    path: pathText.split('.').filter(Boolean),
    pathText,
    stepId: match[1],
  };
}

export function findFirstStepResultBinding(value: string): StepResultBinding | undefined {
  const match = STEP_RESULT_BINDING_PATTERN.exec(value);
  if (!match) return undefined;

  const pathText = match[2] ?? '';
  return {
    path: pathText.split('.').filter(Boolean),
    pathText,
    stepId: match[1],
  };
}

export function isCompleteBinding(value: string): boolean {
  return COMPLETE_BINDING_PATTERN.test(value);
}

export function extractBindingRanges(value: string): BindingTextRange[] {
  const ranges: BindingTextRange[] = [];
  let cursor = 0;

  while (cursor < value.length) {
    const start = value.indexOf('{{', cursor);
    if (start < 0) break;

    const endIndex = value.indexOf('}}', start + 2);
    const nextOpenIndex = value.indexOf('{{', start + 2);
    const hasNestedOpen = nextOpenIndex >= 0 && (endIndex < 0 || nextOpenIndex < endIndex);

    if (endIndex < 0 || hasNestedOpen) {
      ranges.push({ end: findIncompleteBindingEnd(value, start), start });
      cursor = hasNestedOpen ? nextOpenIndex : value.length;
      continue;
    }

    ranges.push({ end: endIndex + 2, start });
    cursor = endIndex + 2;
  }

  return ranges;
}

export function findIncompleteBindingEnd(value: string, start: number): number {
  const nextBoundaryCandidates = [
    value.indexOf('\n', start),
    value.indexOf('"', start + 2),
    value.indexOf(',', start),
    value.indexOf('}', start + 2),
  ].filter(index => index >= 0);

  return nextBoundaryCandidates.length > 0
    ? Math.min(...nextBoundaryCandidates)
    : value.length;
}

export function normalizeRanges(
  ranges: readonly BindingTextRange[],
  length: number,
): BindingTextRange[] {
  const normalized: BindingTextRange[] = [];
  const sortedRanges = ranges
    .map(range => ({
      end: Math.min(length, Math.max(0, range.end)),
      start: Math.min(length, Math.max(0, range.start)),
    }))
    .filter(range => range.end > range.start)
    .sort((left, right) => left.start - right.start);

  for (const range of sortedRanges) {
    const previous = normalized.at(-1);
    if (previous && range.start <= previous.end) {
      previous.end = Math.max(previous.end, range.end);
      continue;
    }

    normalized.push({ ...range });
  }

  return normalized;
}

export function findBindingRange(
  value: string,
  selection: BindingTextRange,
): BindingTextRange | undefined {
  if (selection.start !== selection.end) {
    const selectedText = value.slice(selection.start, selection.end);
    if (/^\{\{[^{}]*\}\}$/.test(selectedText)) {
      return selection;
    }
  }

  const cursor = selection.end;
  const openIndex = value.lastIndexOf('{{', cursor);
  if (openIndex < 0) return undefined;

  const closeIndex = value.indexOf('}}', openIndex + 2);
  if (closeIndex < 0) return undefined;

  const end = closeIndex + 2;
  if (cursor < openIndex || cursor > end) return undefined;

  const innerValue = value.slice(openIndex + 2, closeIndex);
  if (innerValue.includes('{{') || innerValue.includes('\n')) return undefined;

  return {
    end,
    start: openIndex,
  };
}

export function parseBindingPath(value: string): BindingBrowserTarget {
  const path = value.replace(/^\{\{/, '').replace(/\}\}$/, '').trim();

  if (path.startsWith('steps.')) {
    return {
      pane: 'steps',
      stepId: path.split('.')[1] ?? undefined,
    };
  }

  if (path.startsWith('env.')) {
    return {
      pane: 'envs',
      stepId: undefined,
    };
  }

  return {
    pane: 'root',
    stepId: undefined,
  };
}

export function validateBindings(
  value: string,
  previousSteps: readonly BindingStepOption[],
): {
  invalidRanges: BindingTextRange[];
  message: string | undefined;
} {
  const invalidRanges = extractBindingRanges(value)
    .filter(range => !isValidBinding(value.slice(range.start, range.end), previousSteps));

  return {
    invalidRanges,
    message: invalidRanges.length > 0 ? 'Binding incompleto o inválido' : undefined,
  };
}

export function isValidBinding(
  value: string,
  previousSteps: readonly BindingStepOption[],
): boolean {
  if (!COMPLETE_BINDING_PATTERN.test(value)) return false;

  const path = value.slice(2, -2);
  if (
    path === 'env.allowedOrigins'
    || path === 'env.expirationTimeout'
    || path === 'env.inactivityTimeout'
    || path === 'env.maxConnections'
    || path === 'env.resumeConnection'
    || path === 'env.secret'
  ) return true;

  const parts = path.split('.');
  if (parts.length < 3 || parts[0] !== 'steps' || parts[2] !== 'result') return false;

  const step = previousSteps.find(item => item.id === parts[1]);
  if (!step) return false;
  if (parts.length === 3) return true;

  const field = parts.slice(3).join('.');
  return field.length > 0 && step.fields.includes(field);
}
