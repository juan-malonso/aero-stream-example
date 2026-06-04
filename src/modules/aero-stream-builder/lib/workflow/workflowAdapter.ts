import { type Edge, type Node } from "@xyflow/react";

import { colors } from "@/styles/tokens";

import {
  getBuilderStepByExecutionType,
  type OutputConfig,
  type StepNodeData,
} from "../steps";

import {
  EXECUTION_TYPE_TO_NODE,
  NODE_TYPE_TO_EXECUTION,
} from "./componentRegistry";
import {
  DEFAULT_WORKFLOW_CONFIG,
  type TowerWorkflow,
  type WorkflowConfig,
  type WorkflowStep,
  type WorkflowTransition,
} from "./workflow";

const LAYOUT_MARGIN_X = 100;
const LAYOUT_MARGIN_Y = 120;
const LEVEL_GAP_X = 88;
const NODE_GAP_Y = 34;
const COLLISION_GAP_Y = 14;
const START_NODE_WIDTH = 96;
const START_NODE_HEIGHT = 56;
const STEP_NODE_WIDTH = 320;
const STEP_NODE_HEADER_HEIGHT = 40;
const STEP_NODE_BASE_HEIGHT = 80;
const STEP_OUTPUT_HEIGHT = 24;
const REMOVED_SPEC_KEYS = new Set(["stop".concat("Workflow")]);

export function parseTowerToReactFlow(towerWorkflow: TowerWorkflow): {
  nodes: Node[];
  edges: Edge[];
} {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const nodePositions = buildWorkflowNodePositions(towerWorkflow);

  nodes.push({
    id: "start_node",
    type: "startNode",
    position: nodePositions.start_node,
    data: { label: "Start" },
  });

  if (towerWorkflow.start) {
    edges.push({
      id: `e-start_node-${towerWorkflow.start}`,
      source: "start_node",
      sourceHandle: "start",
      target: towerWorkflow.start,
      targetHandle: "flow-in",
      animated: true,
      style: { stroke: colors.pink500, strokeWidth: 2 },
      zIndex: 100,
    });
  }

  Object.entries(towerWorkflow.steps).forEach(([stepId, step]) => {
    if (!step) return;

    const executionType = step.execution.type;
    const nodeType = EXECUTION_TYPE_TO_NODE[executionType] ?? "welcomeStep";
    const stepDefinition = getBuilderStepByExecutionType(executionType);

    const currentOutputs: OutputConfig[] = [];
    const hideOutputs = stepDefinition?.hideOutputs ?? false;
    const nodeData = {
      code: step.code
        ? { ...step.code }
        : stepDefinition?.defaultCode ? { ...stepDefinition.defaultCode } : undefined,
      label: step.name,
      stepName: step.name,
      props: { ...step.props },
      specs: cleanSpecs(step.specs),
      execution: { ...step.execution },
      fields: stepDefinition?.fields ?? [],
      hideOutputs,
      outputs: currentOutputs,
    };

    nodes.push({
      id: stepId,
      type: nodeType,
      position: nodePositions[stepId] ?? { x: 0, y: 0 },
      data: nodeData,
    });

    if (hideOutputs) return;

    step.transitions.forEach((transition, tIndex) => {
      let sourceHandle = "default";

      if (
        typeof transition.condition === "object" &&
        transition.condition !== undefined
      ) {
        const opKeys = Object.keys(transition.condition);
        if (opKeys.length > 0) {
          const operator = opKeys[0];
          const arguments_ = (
            transition.condition as unknown as Record<string, unknown>
          )[operator];

          if (
            Array.isArray(arguments_) &&
            arguments_.length === 2 &&
            arguments_[0] &&
            (arguments_[0] as Record<string, unknown>).var !== undefined
          ) {
            let field = (arguments_[0] as Record<string, string>).var;
            if (typeof field === "string" && !field.startsWith("{{")) {
              field = `{{${field}}}`;
            }
            const value = arguments_[1] as unknown;
            const opRevMap: Record<string, string> = {
              "==": "eq",
              "!=": "neq",
              ">": "gt",
              "<": "lt",
            };
            const internalOp = opRevMap[operator] ?? "eq";

            const outId = `out_${stepId}_${tIndex}`;
            currentOutputs.push({
              id: outId,
              field,
              operator: internalOp,
              value: String(value),
            });
            sourceHandle = outId;
          }
        }
      }

      edges.push({
        id: `e-${stepId}-${transition.next}-${tIndex}`,
        source: stepId,
        sourceHandle,
        target: transition.next,
        targetHandle: "flow-in",
        animated: true,
        style: { stroke: colors.pink500, strokeWidth: 2 },
        zIndex: 100,
      });
    });
  });

  return { nodes: resolveWorkflowNodeOverlaps(nodes), edges };
}

export function resolveWorkflowNodeOverlaps(
  nodes: Node[],
  options: { fixedIds?: Set<string> } = {},
): Node[] {
  const fixedIds = options.fixedIds ?? new Set<string>();
  const resolved = nodes.map(node => ({ ...node, position: { ...node.position } }));

  for (const _pass of resolved) {
    let changed = false;
    const orderedIndexes = resolved
      .map((node, index) => ({ index, node }))
      .sort((left, right) =>
        left.node.position.y - right.node.position.y
        || left.node.position.x - right.node.position.x);

    orderedIndexes.forEach((orderedLeft, leftIndex) => {
      for (const orderedRight of orderedIndexes.slice(leftIndex + 1)) {
        const firstIndex = orderedLeft.index;
        const secondIndex = orderedRight.index;
        const first = resolved[firstIndex];
        const second = resolved[secondIndex];
        if (!nodesOverlap(first, second)) continue;

        const moveFirst = fixedIds.has(second.id) && !fixedIds.has(first.id);
        const moverIndex = moveFirst ? firstIndex : secondIndex;
        const blockerIndex = moveFirst ? secondIndex : firstIndex;
        const blockerBox = nodeBox(resolved[blockerIndex]);
        const mover = resolved[moverIndex];
        const nextY = blockerBox.bottom + COLLISION_GAP_Y;

        if (mover.position.y < nextY) {
          resolved[moverIndex] = {
            ...mover,
            position: { ...mover.position, y: nextY },
          };
          changed = true;
        }
      }
    });

    if (!changed) break;
  }

  return resolved;
}

function buildWorkflowNodePositions(towerWorkflow: TowerWorkflow): Record<string, { x: number; y: number }> {
  const levels = workflowNodeLevels(towerWorkflow);
  const levelGroups = new Map<number, string[]>();

  for (const [nodeId, level] of Object.entries(levels)) {
    const group = levelGroups.get(level) ?? [];
    group.push(nodeId);
    levelGroups.set(level, group);
  }

  const sortedLevels = Array.from(levelGroups.keys()).sort((left, right) => left - right);
  const levelWidths = new Map<number, number>();
  for (const level of sortedLevels) {
    levelWidths.set(level, Math.max(...(levelGroups.get(level) ?? []).map(nodeId =>
      estimateNodeSize(nodeId, towerWorkflow).width,
    )));
  }

  const levelX = new Map<number, number>();
  let cursorX = LAYOUT_MARGIN_X;
  for (const level of sortedLevels) {
    levelX.set(level, cursorX);
    cursorX += (levelWidths.get(level) ?? STEP_NODE_WIDTH) + LEVEL_GAP_X;
  }

  const levelHeights = new Map<number, number>();
  for (const level of sortedLevels) {
    const ids = levelGroups.get(level) ?? [];
    const height = ids.reduce((total, nodeId, index) =>
      total + estimateNodeSize(nodeId, towerWorkflow).height + (index > 0 ? NODE_GAP_Y : 0), 0);
    levelHeights.set(level, height);
  }

  const maxHeight = Math.max(0, ...Array.from(levelHeights.values()));
  const positions: Record<string, { x: number; y: number }> = {};

  for (const level of sortedLevels) {
    const ids = levelGroups.get(level) ?? [];
    let cursorY = LAYOUT_MARGIN_Y + (maxHeight - (levelHeights.get(level) ?? 0)) / 2;

    for (const nodeId of ids) {
      positions[nodeId] = { x: levelX.get(level) ?? LAYOUT_MARGIN_X, y: cursorY };
      cursorY += estimateNodeSize(nodeId, towerWorkflow).height + NODE_GAP_Y;
    }
  }

  return positions;
}

function workflowNodeLevels(towerWorkflow: TowerWorkflow): Record<string, number> {
  const levels: Record<string, number> = { start_node: 0 };
  const stepIds = Object.keys(towerWorkflow.steps);
  if (towerWorkflow.start && towerWorkflow.steps[towerWorkflow.start]) {
    levels[towerWorkflow.start] = 1;
  }

  for (const _stepId of stepIds) {
    let changed = false;

    for (const stepId of stepIds) {
      const currentLevel = levels[stepId];
      if (currentLevel === undefined) continue;

      const step = towerWorkflow.steps[stepId];
      const stepDefinition = getBuilderStepByExecutionType(step.execution.type);
      if (stepDefinition?.hideOutputs) continue;

      for (const transition of step.transitions) {
        if (!towerWorkflow.steps[transition.next]) continue;

        const nextLevel = currentLevel + 1;
        if ((levels[transition.next] ?? -1) < nextLevel) {
          levels[transition.next] = nextLevel;
          changed = true;
        }
      }
    }

    if (!changed) break;
  }

  const unlinkedLevel = Math.max(0, ...Object.values(levels)) + 1;
  for (const stepId of stepIds) {
    levels[stepId] ??= unlinkedLevel;
  }

  return levels;
}

function estimateNodeSize(nodeId: string, towerWorkflow?: TowerWorkflow): { height: number; width: number } {
  if (nodeId === "start_node") {
    return { height: START_NODE_HEIGHT, width: START_NODE_WIDTH };
  }

  const step = towerWorkflow?.steps[nodeId];
  const stepDefinition = step ? getBuilderStepByExecutionType(step.execution.type) : null;
  if (stepDefinition?.hideOutputs) {
    return { height: STEP_NODE_HEADER_HEIGHT, width: STEP_NODE_WIDTH };
  }

  const outputCount = Math.max(1, step?.transitions.length ?? 1);

  return {
    height: STEP_NODE_BASE_HEIGHT + outputCount * STEP_OUTPUT_HEIGHT,
    width: STEP_NODE_WIDTH,
  };
}

function estimateReactFlowNodeSize(node: Node): { height: number; width: number } {
  if (node.type === "startNode") return { height: START_NODE_HEIGHT, width: START_NODE_WIDTH };

  const data = node.data as unknown as Partial<StepNodeData>;
  if (data.hideOutputs) {
    return { height: STEP_NODE_HEADER_HEIGHT, width: STEP_NODE_WIDTH };
  }

  const outputCount = Math.max(1, data.outputs?.length ?? 1);

  return {
    height: STEP_NODE_BASE_HEIGHT + outputCount * STEP_OUTPUT_HEIGHT,
    width: STEP_NODE_WIDTH,
  };
}

function nodeBox(node: Node): { bottom: number; left: number; right: number; top: number } {
  const size = estimateReactFlowNodeSize(node);
  return {
    bottom: node.position.y + size.height,
    left: node.position.x,
    right: node.position.x + size.width,
    top: node.position.y,
  };
}

function nodesOverlap(first: Node, second: Node): boolean {
  const firstBox = nodeBox(first);
  const secondBox = nodeBox(second);

  return firstBox.left < secondBox.right
    && firstBox.right > secondBox.left
    && firstBox.top < secondBox.bottom
    && firstBox.bottom > secondBox.top;
}

export function parseReactFlowToTower(
  nodes: Node[],
  edges: Edge[],
  name: string,
  config?: WorkflowConfig,
): TowerWorkflow {
  const steps: Record<string, WorkflowStep> = {};

  const startEdge = edges.find((edge) => edge.source === "start_node");
  const startStepId = startEdge?.target ?? "";

  const opMap: Record<string, string> = {
    eq: "==",
    neq: "!=",
    gt: ">",
    lt: "<",
  };

  nodes.forEach((node) => {
    if (node.type === "startNode") return;

    const nodeData = node.data as unknown as StepNodeData;
    const outEdges = edges.filter((edge) => edge.source === node.id);
    const executionType =
      NODE_TYPE_TO_EXECUTION[node.type ?? ""] ?? node.type ?? "";

    const sortedTransitions: WorkflowTransition[] = [];

    if (!nodeData.hideOutputs) {
      (nodeData.outputs ?? []).forEach((output) => {
        const edge = outEdges.find((sourceEdge) => sourceEdge.sourceHandle === output.id);
        if (edge) {
          const sym = opMap[output.operator] ?? "==";
          let variableField = output.field ?? "";
          if (
            typeof variableField === "string" &&
            variableField !== "" &&
            !variableField.startsWith("{{")
          ) {
            variableField = `{{${variableField}}}`;
          }

          sortedTransitions.push({
            condition: {
              [sym]: [{ var: variableField }, output.value],
            },
            next: edge.target,
          });
        }
      });

      const defaultEdge = outEdges.find((edge) => edge.sourceHandle === "default");
      if (defaultEdge) {
        sortedTransitions.push({
          condition: true,
          next: defaultEdge.target,
        });
      }
    }

    steps[node.id] = {
      code: nodeData.code,
      execution: nodeData.execution ?? { mode: "CLIENT", type: executionType },
      name: nodeData.stepName ?? nodeData.label ?? "",
      props: nodeData.props ?? {},
      specs: cleanSpecs(nodeData.specs),
      transitions: sortedTransitions,
    };
  });

  return {
    name,
    version: 1,
    start: startStepId,
    steps,
    globals: {},
    config: config ?? DEFAULT_WORKFLOW_CONFIG,
  };
}

function cleanSpecs(specs?: Record<string, unknown>): Record<string, unknown> {
  if (!specs) return {};

  return Object.fromEntries(
    Object.entries(specs).filter(([key]) => !REMOVED_SPEC_KEYS.has(key)),
  );
}
