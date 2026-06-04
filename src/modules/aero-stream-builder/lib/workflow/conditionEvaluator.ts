import type { Edge } from '@xyflow/react';

import type { StepNodeData } from '../steps';

import { parseStepResultBinding } from './bindings.ts';
import { readPath } from './runtimeValues.ts';

export interface PreviewActionResult {
  emitted: 'reject' | 'submit';
  value: unknown;
}

export function resolveNextStepId({
  edges,
  inputValue,
  previewAction,
  selectedNodeId,
  stepData,
}: {
  edges: Edge[];
  inputValue: Record<string, unknown>;
  previewAction: PreviewActionResult;
  selectedNodeId: string;
  stepData: StepNodeData;
}): string | undefined {
  const matchedOutput = (stepData.outputs ?? []).find(output =>
    evaluateConditionOutput({
      inputValue,
      output,
      previewAction,
      selectedNodeId,
    }),
  );

  const matchedEdge = matchedOutput
    ? edges.find(edge =>
      edge.source === selectedNodeId && edge.sourceHandle === matchedOutput.id,
    )
    : undefined;

  const defaultEdge = edges.find(edge =>
    edge.source === selectedNodeId && edge.sourceHandle === 'default',
  );

  return matchedEdge?.target ?? defaultEdge?.target ?? undefined;
}

export function evaluateConditionOutput({
  inputValue,
  output,
  previewAction,
  selectedNodeId,
}: {
  inputValue: Record<string, unknown>;
  output: NonNullable<StepNodeData['outputs']>[number];
  previewAction: PreviewActionResult;
  selectedNodeId: string;
}): boolean {
  const actualValue = resolveConditionValue({
    field: output.field,
    inputValue,
    previewAction,
    selectedNodeId,
  });
  const expectedValue = normalizeExpectedValue(output.value, actualValue);

  switch (output.operator) {
    case 'neq':
      return !areComparableValuesEqual(actualValue, expectedValue);
    case 'gt':
      return compareNumericValues(actualValue, expectedValue, 'gt');
    case 'lt':
      return compareNumericValues(actualValue, expectedValue, 'lt');
    case 'eq':
    default:
      return areComparableValuesEqual(actualValue, expectedValue);
  }
}

function resolveConditionValue({
  field,
  inputValue,
  previewAction,
  selectedNodeId,
}: {
  field: string;
  inputValue: Record<string, unknown>;
  previewAction: PreviewActionResult;
  selectedNodeId: string;
}): unknown {
  const binding = parseStepResultBinding(field);
  if (!binding) return readPath(inputValue, [field]);

  if (binding.stepId === selectedNodeId) {
    return readPath(previewAction.value, binding.path);
  }

  return readPath(inputValue, binding.path);
}

function normalizeExpectedValue(value: string, actualValue: unknown): unknown {
  const trimmedValue = value.trim();

  if (typeof actualValue === 'number') {
    const numericValue = Number(trimmedValue);
    return Number.isNaN(numericValue) ? value : numericValue;
  }

  if (typeof actualValue === 'boolean') {
    if (trimmedValue === 'true') return true;
    if (trimmedValue === 'false') return false;
  }

  if (trimmedValue === 'null') return null;
  return value;
}

function areComparableValuesEqual(leftValue: unknown, rightValue: unknown): boolean {
  if (typeof leftValue === typeof rightValue) return Object.is(leftValue, rightValue);
  return String(leftValue) === String(rightValue);
}

function compareNumericValues(
  leftValue: unknown,
  rightValue: unknown,
  operator: 'gt' | 'lt',
): boolean {
  const leftNumber = Number(leftValue);
  const rightNumber = Number(rightValue);
  if (Number.isNaN(leftNumber) || Number.isNaN(rightNumber)) return false;

  return operator === 'gt'
    ? leftNumber > rightNumber
    : leftNumber < rightNumber;
}
