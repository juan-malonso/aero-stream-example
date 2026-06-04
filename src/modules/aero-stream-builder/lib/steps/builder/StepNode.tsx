import {
  type Edge,
  Handle,
  type Node,
  Position,
  useReactFlow,
} from "@xyflow/react";
import React from "react";
import { createPortal } from "react-dom";

import { Button, Card, Input, Label, Row, Select } from "@/libs/ui";
import { ExecutionBadge } from "@/libs/ui/shared/ExecutionBadge";
import { cardHeaderStyle, cardStyle, handleStyles } from "@/styles/theme";
import { colors } from "@/styles/tokens";

import { parseStepResultBinding } from "../../workflow/bindings";

import {
  type OutputConfig,
  type StepNodeData,
  type StepNodeProperties,
} from "./types";

export type { OutputConfig, StepNodeData };

// --- Private Components (Not Exported) --- //

interface NodeFieldProperties {
  id?: string;
  color?: string;
  bgColor?: string;
  leftHandle?: "fieldSource" | "fieldTarget" | "flowSource" | "flowTarget";
  rightHandle?: "fieldSource" | "fieldTarget" | "flowSource" | "flowTarget";
  leftId?: string;
  rightId?: string;
  children: React.ReactNode;
}

interface ConditionReferenceOption {
  fields: string[];
  id: string;
  name: string;
}

interface ReferenceMenuPosition {
  left: number;
  top: number;
}

type ConditionMenuPane = "root" | "steps";

function NodeField({
  id,
  color = colors.gray600,
  leftHandle,
  rightHandle,
  leftId,
  rightId,
  children,
}: NodeFieldProperties) {
  return (
    <Row
      style={{
        position: "relative",
        minHeight: "22px",
        alignItems: "center",
        backgroundColor: colors.gray50,
        border: `1px solid ${color}`,
        borderRadius: "0.3rem",
        boxSizing: "border-box",
        padding: "2px",
      }}
    >
      {leftHandle && (
        <Handle
          type={leftHandle.includes("Target") ? "target" : "source"}
          position={Position.Left}
          id={leftId ?? `in-${id}`}
          style={{ ...handleStyles[leftHandle](10), zIndex: 10 }}
        />
      )}
      {children}
      {rightHandle && (
        <Handle
          type={rightHandle.includes("Target") ? "target" : "source"}
          position={Position.Right}
          id={rightId ?? `out-${id}`}
          style={{ ...handleStyles[rightHandle](10), zIndex: 10 }}
        />
      )}
    </Row>
  );
}

function ConditionsSection({
  outputs,
  hideOutputs,
  addOutput,
  updateOutput,
  removeOutput,
  references,
}: {
  outputs: OutputConfig[];
  hideOutputs?: boolean;
  addOutput: () => void;
  updateOutput: (index: number, key: keyof OutputConfig, value: string) => void;
  removeOutput: (index: number) => void;
  references: ConditionReferenceOption[];
}) {
  const [activeMenu, setActiveMenu] = React.useState<{
    index: number;
    pane: ConditionMenuPane;
    position: ReferenceMenuPosition;
    selectedStepId: string | undefined;
  } | undefined>(undefined);

  if (hideOutputs) return null;

  const openReferenceMenu = (
    index: number,
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    const selectedStepId = parseReference(outputs[index]?.field).stepId;
    setActiveMenu({
      index,
      pane: "steps",
      position: {
        left: event.clientX + 8,
        top: event.clientY + 8,
      },
      selectedStepId,
    });
  };

  const selectReference = (stepId: string, field: string) => {
    if (!activeMenu) return;

    updateOutput(activeMenu.index, "field", `{{steps.${stepId}.result.${field}}}`);
    setActiveMenu(undefined);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Label style={{ color: colors.gray500, fontSize: "10px", margin: 0 }}>
          Conditions
        </Label>
        <Button
          onClick={addOutput}
          variant="primary"
          size="xs"
          style={{ borderRadius: "6px", fontWeight: 800 }}
          type="button"
        >
          + Add
        </Button>
      </div>

      {outputs.map((out, index) => (
        <NodeField
          key={out.id}
          color={colors.gray400}
          rightHandle="flowSource"
          rightId={out.id}
        >
          <Row
            style={{
              width: "100%",
              height: "100%",
              alignItems: "stretch",
              padding: 0,
              gap: "4px",
            }}
          >
            <button
              onClick={(event) => { openReferenceMenu(index, event); }}
              style={conditionReferenceButtonStyle}
              type="button"
            >
              {formatConditionReference(out.field, references)}
            </button>
            <Select
              controlSize="xs" value={out.operator}
              onChange={(event) => { updateOutput(index, "operator", event.target.value); }}
              style={{
                boxSizing: "border-box",
                height: "20px",
                fontSize: "10px",
                minHeight: 0,
                padding: "0 3px",
                width: "40px",
                margin: 0,
              }}
            >
              <option value="eq">==</option>
              <option value="neq">!=</option>
              <option value="gt">&gt;</option>
              <option value="lt">&lt;</option>
            </Select>
            <Input
              controlSize="xs" type="text"
              placeholder="Value"
              value={out.value}
              onChange={(event) => { updateOutput(index, "value", event.target.value); }}
              style={{
                flex: 1,
                boxSizing: "border-box",
                height: "20px",
                fontSize: "10px",
                minWidth: "46px",
                minHeight: 0,
                margin: 0,
                padding: "0 5px",
              }}
            />
            <Button
              onClick={() => { removeOutput(index); }}
              variant="ghost"
              size="xs"
              style={{
                boxSizing: "border-box",
                borderRadius: "5px",
                color: colors.red500,
                minHeight: 0,
                minWidth: "20px",
                padding: 0,
                height: "20px",
                margin: 0,
              }}
              type="button"
            >
              ✕
            </Button>
          </Row>
        </NodeField>
      ))}

      {activeMenu ? (
        <ConditionReferenceMenu
          onClose={() => { setActiveMenu(undefined); }}
          onSelect={selectReference}
          position={activeMenu.position}
          references={references}
          pane={activeMenu.pane}
          selectedStepId={activeMenu.selectedStepId}
          setPane={(pane) => {
            setActiveMenu(current => current ? { ...current, pane } : undefined);
          }}
          setSelectedStepId={(stepId) => {
            setActiveMenu(current => current ? { ...current, selectedStepId: stepId } : undefined);
          }}
        />
      ) : null}

      <NodeField
        rightHandle="flowSource"
        rightId="default"
        color={colors.gray400}
      >
        <Row
          style={{
            width: "100%",
            height: "100%",
            alignItems: "stretch",
            padding: 0,
          }}
        >
          <div
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              textAlign: "right",
              fontSize: "10px",
              fontWeight: 600,
              color: colors.gray600,
              paddingRight: "5px",
              boxSizing: "border-box",
            }}
          >
            Next (Default)
          </div>
        </Row>
      </NodeField>
    </div>
  );
}

function ConditionReferenceMenu({
  onClose,
  onSelect,
  pane,
  position,
  references,
  selectedStepId,
  setPane,
  setSelectedStepId,
}: {
  onClose: () => void;
  onSelect: (stepId: string, field: string) => void;
  pane: ConditionMenuPane;
  position: ReferenceMenuPosition;
  references: ConditionReferenceOption[];
  selectedStepId: string | undefined;
  setPane: (pane: ConditionMenuPane) => void;
  setSelectedStepId: (stepId: string) => void;
}) {
  const selectedStep = references.find(reference => reference.id === selectedStepId);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div onMouseDown={onClose} style={conditionMenuOverlayStyle}>
      <div
        onMouseDown={(event) => { event.stopPropagation(); }}
        style={{
          ...conditionMenuStyle,
          left: clampMenuPosition(position).left,
          top: clampMenuPosition(position).top,
        }}
      >
        <div style={conditionMenuColumnStyle}>
          <button
            disabled={references.length === 0}
            onClick={() => {
              if (references.length === 0) return;

              setPane("steps");
              setSelectedStepId(selectedStepId ?? references[0].id);
            }}
            style={{
              ...conditionMenuButtonStyle,
              ...(pane === "steps" ? conditionMenuSelectedButtonStyle : {}),
              ...(references.length === 0 ? conditionMenuDisabledButtonStyle : {}),
            }}
            type="button"
          >
            <span style={conditionMenuButtonTextStyle}>steps</span>
            {references.length > 0 ? <span>›</span> : null}
          </button>
        </div>

        {pane === "steps" ? (
          <div style={conditionMenuColumnStyle}>
            {references.length === 0 ? (
              <div style={conditionMenuEmptyStyle}>No fields available</div>
            ) : references.map(reference => (
              <button
                key={reference.id}
                disabled={reference.fields.length === 0}
                onClick={() => { setSelectedStepId(reference.id); }}
                style={{
                  ...conditionMenuButtonStyle,
                  ...(reference.id === selectedStepId ? conditionMenuSelectedButtonStyle : {}),
                  ...(reference.fields.length === 0 ? conditionMenuDisabledButtonStyle : {}),
                }}
                type="button"
              >
                <span style={conditionMenuButtonTextStyle}>{reference.name}</span>
                {reference.fields.length > 0 ? <span>›</span> : null}
              </button>
            ))}
          </div>
        ) : null}

        {pane === "steps" && selectedStep ? (
          <div style={conditionMenuColumnStyle}>
            {selectedStep.fields.map(field => (
              <button
                key={field}
                onClick={() => { onSelect(selectedStep.id, field); }}
                style={conditionMenuButtonStyle}
                type="button"
              >
                <span style={conditionMenuButtonTextStyle}>{field}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

function NodeErrorMessage({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        color: colors.red600,
        fontSize: "10px",
        fontWeight: 700,
        padding: "6px 10px 0",
      }}
    >
      {children}
    </div>
  );
}

function buildConditionReferences(
  currentNodeId: string,
  currentNodeData: StepNodeData,
  nodes: Node[],
  edges: Edge[],
): ConditionReferenceOption[] {
  const ancestorIds = collectAncestorStepIds(currentNodeId, edges);
  const nodeMap = new Map(nodes.map(node => [node.id, node]));
  const orderedIds = [
    currentNodeId,
    ...nodes
      .map(node => node.id)
      .filter(nodeId => ancestorIds.has(nodeId) && nodeId !== currentNodeId),
  ];

  return orderedIds
    .map((nodeId) => {
      const node = nodeMap.get(nodeId);
      const nodeData = nodeId === currentNodeId
        ? currentNodeData
        : node?.data as unknown as Partial<StepNodeData> | undefined;

      if (!nodeData?.execution) return null;

      return {
        fields: nodeData.fields ?? [],
        id: nodeId,
        name: nodeData.stepName ?? nodeData.label ?? nodeData.execution.type,
      };
    })
    .filter((reference): reference is ConditionReferenceOption => reference !== undefined);
}

function collectAncestorStepIds(currentNodeId: string, edges: Edge[]): Set<string> {
  const ancestors = new Set<string>();
  const pending = edges
    .filter(edge => edge.target === currentNodeId)
    .map(edge => edge.source);

  while (pending.length > 0) {
    const sourceId = pending.pop();
    if (!sourceId || sourceId === "start_node" || ancestors.has(sourceId)) continue;

    ancestors.add(sourceId);
    edges
      .filter(edge => edge.target === sourceId)
      .forEach(edge => {
        if (!ancestors.has(edge.source)) pending.push(edge.source);
      });
  }

  return ancestors;
}

function parseReference(value: string | undefined): {
  field: string | undefined;
  stepId: string | undefined;
} {
  if (!value) return { field: undefined, stepId: undefined };

  const binding = parseStepResultBinding(value);
  if (!binding) return { field: undefined, stepId: undefined };

  return { field: binding.pathText || undefined, stepId: binding.stepId };
}

function formatConditionReference(
  value: string | undefined,
  references: ConditionReferenceOption[],
): string {
  const reference = parseReference(value);
  if (!reference.stepId || !reference.field) return "Choose field";

  const step = references.find(item => item.id === reference.stepId);
  return `${step?.name ?? "Step"}.${reference.field}`;
}

function clampMenuPosition(position: ReferenceMenuPosition): ReferenceMenuPosition {
  if (typeof window === "undefined") return position;

  const margin = 8;
  const estimatedMenuWidth = 420;
  const estimatedMenuHeight = 260;

  return {
    left: Math.min(
      Math.max(position.left, margin),
      Math.max(margin, window.innerWidth - estimatedMenuWidth),
    ),
    top: Math.min(
      Math.max(position.top, margin),
      Math.max(margin, window.innerHeight - estimatedMenuHeight),
    ),
  };
}

const conditionReferenceButtonStyle: React.CSSProperties = {
  alignItems: "center",
  background: colors.blue50,
  border: `1px solid ${colors.blue200}`,
  borderRadius: "0.25rem",
  boxSizing: "border-box",
  color: colors.blue800,
  cursor: "pointer",
  display: "inline-flex",
  flex: "1.2 1 0",
  fontSize: "10px",
  fontWeight: 700,
  height: "20px",
  minWidth: "74px",
  overflow: "hidden",
  padding: "0 5px",
  textAlign: "left",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const conditionMenuOverlayStyle: React.CSSProperties = {
  background: "transparent",
  inset: 0,
  position: "fixed",
  zIndex: 80,
};

const conditionMenuStyle: React.CSSProperties = {
  background: colors.white,
  border: `1px solid ${colors.gray300}`,
  borderRadius: "0.375rem",
  boxShadow: "0 14px 32px rgba(15, 23, 42, 0.18)",
  display: "flex",
  maxHeight: "18rem",
  overflow: "hidden",
  position: "absolute",
  width: "max-content",
};

const conditionMenuColumnStyle: React.CSSProperties = {
  borderRight: `1px solid ${colors.gray200}`,
  display: "flex",
  flexDirection: "column",
  gap: "0.25rem",
  maxWidth: "14rem",
  minWidth: "7rem",
  overflowX: "hidden",
  overflowY: "auto",
  padding: "0.25rem",
};

const conditionMenuButtonStyle: React.CSSProperties = {
  alignItems: "center",
  background: "transparent",
  border: "none",
  borderRadius: "0.25rem",
  color: colors.gray800,
  cursor: "pointer",
  display: "flex",
  fontSize: "11px",
  fontWeight: 700,
  gap: "0.5rem",
  justifyContent: "space-between",
  minHeight: "1.5rem",
  padding: "0.25rem 0.375rem",
  textAlign: "left",
  whiteSpace: "nowrap",
  width: "100%",
};

const conditionMenuSelectedButtonStyle: React.CSSProperties = {
  background: colors.blue50,
  boxShadow: `inset 0 0 0 1px ${colors.blue200}`,
  color: colors.blue800,
};

const conditionMenuDisabledButtonStyle: React.CSSProperties = {
  color: colors.gray400,
  cursor: "default",
  opacity: 0.68,
};

const conditionMenuButtonTextStyle: React.CSSProperties = {
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const conditionMenuEmptyStyle: React.CSSProperties = {
  color: colors.gray500,
  fontSize: "11px",
  padding: "0.75rem",
  textAlign: "center",
};

// --- Main Node Export --- //

export function StepNode({
  id,
  data,
  accentColor = colors.gray500,
  children,
}: StepNodeProperties) {
  const { getEdges, getNodes, updateNodeData } = useReactFlow();

  const outputs = data.outputs ?? [];
  const nodeName = data.stepName ?? data.label ?? data.execution.type;
  const isNameDuplicated = data.isNameDuplicated === true;
  const isOutputDisconnected = data.isOutputDisconnected === true;
  const hasConfigurationError = isNameDuplicated || isOutputDisconnected;
  const references = buildConditionReferences(id, data, getNodes(), getEdges());
  const hasContentBody = Boolean(children) || data.hideOutputs !== true;

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateNodeData(id, {
      label: event.target.value,
      stepName: event.target.value,
    });
  };

  const addOutput = () => {
    updateNodeData(id, {
      outputs: [
        ...outputs,
        { id: `out_${Date.now()}`, field: "", operator: "eq", value: "" },
      ],
    });
  };

  const updateOutput = (
    index: number,
    key: keyof OutputConfig,
    value: string,
  ) => {
    const updated = [...outputs];
    updated[index] = { ...updated[index], [key]: value };
    updateNodeData(id, { outputs: updated });
  };

  const removeOutput = (index: number) => {
    updateNodeData(id, { outputs: outputs.filter((_, index_) => index_ !== index) });
  };

  return (
    <Card
      style={{
        ...cardStyle,
        minWidth: "288px",
        maxWidth: "328px",
        border: `1px solid ${hasConfigurationError ? colors.red500 : accentColor}`,
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        id="flow-in"
        style={{
          ...handleStyles.flowTarget(10),
          top: "24px",
          left: "-5px",
          zIndex: 10,
        }}
      />

      <div
        style={{
          ...cardHeaderStyle(hasConfigurationError ? colors.red500 : accentColor),
          borderBottomWidth: "2px",
          gap: "6px",
          padding: "6px 8px",
        }}
      >
        <Input
          aria-label="Node name"
          controlSize="xs"
          onChange={handleNameChange}
          style={{
            background: colors.white,
            border: `1px solid ${isNameDuplicated ? colors.red500 : colors.gray300}`,
            color: isNameDuplicated ? colors.red600 : colors.gray800,
            fontSize: "12px",
            fontWeight: 700,
            height: "26px",
            lineHeight: 1.15,
            minWidth: 0,
            minHeight: 0,
            padding: "2px 6px",
          }}
          type="text"
          value={nodeName}
        />
        <ExecutionBadge mode={data.execution.mode} />
      </div>
      {isNameDuplicated ? (
        <NodeErrorMessage>Nombre duplicado</NodeErrorMessage>
      ) : null}
      {isOutputDisconnected ? (
        <NodeErrorMessage>Output sin conectar</NodeErrorMessage>
      ) : null}

      {hasContentBody ? (
        <div
          style={{
            padding: "6px 8px",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
          }}
        >
          {children}
          <ConditionsSection
            outputs={outputs}
            hideOutputs={data.hideOutputs}
            addOutput={addOutput}
            updateOutput={updateOutput}
            removeOutput={removeOutput}
            references={references}
          />
        </div>
      ) : null}
    </Card>
  );
}
