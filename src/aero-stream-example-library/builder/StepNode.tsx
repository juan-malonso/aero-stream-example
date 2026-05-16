import { Handle, Position, useReactFlow } from "@xyflow/react";
import React from "react";

import { ExecutionBadge } from "@/components/shared/ExecutionBadge";
import {
  type OutputConfig,
  type StepNodeData,
  type StepNodeProps,
} from "./types";
import { colors } from "@/styles/tokens";
import { cardStyle, cardHeaderStyle, handleStyles } from "@/styles/theme";
import { Card, Input, Label, Select, Button, Row } from "@/components/ui";

export type { OutputConfig, StepNodeData };

// --- Private Components (Not Exported) --- //

interface NodeFieldProps {
  id?: string;
  color?: string;
  bgColor?: string;
  leftHandle?: "fieldSource" | "fieldTarget" | "flowSource" | "flowTarget";
  rightHandle?: "fieldSource" | "fieldTarget" | "flowSource" | "flowTarget";
  leftId?: string;
  rightId?: string;
  children: React.ReactNode;
}

interface NodeSectionProps {
  label?: string;
  color?: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode | React.ReactNode[];
}

function NodeField({
  id,
  color = colors.gray600,
  leftHandle,
  rightHandle,
  leftId,
  rightId,
  children,
}: NodeFieldProps) {
  return (
    <Row
      style={{
        position: "relative",
        height: "20px",
        alignItems: "center",
        backgroundColor: colors.gray100,
        border: `1px solid ${color}`,
        borderRadius: "0.3rem",
        padding: "2px",
      }}
    >
      {leftHandle && (
        <Handle
          type={leftHandle.includes("Target") ? "target" : "source"}
          position={Position.Left}
          id={leftId || `in-${id}`}
          style={{ ...handleStyles[leftHandle](10), zIndex: 10 }}
        />
      )}
      {children}
      {rightHandle && (
        <Handle
          type={rightHandle.includes("Target") ? "target" : "source"}
          position={Position.Right}
          id={rightId || `out-${id}`}
          style={{ ...handleStyles[rightHandle](10), zIndex: 10 }}
        />
      )}
    </Row>
  );
}

function NodeSection({
  label,
  color,
  headerRight,
  children,
}: NodeSectionProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      {(label || headerRight) && (
        <Row
          style={{
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
          }}
        >
          {label ? (
            <Label style={{ color, fontSize: "11px", margin: 0 }}>
              {label}
            </Label>
          ) : (
            <div />
          )}
          {headerRight}
        </Row>
      )}
      {children}
    </div>
  );
}

function ConfigurationSection({
  stepName,
  handleNameChange,
}: {
  stepName: string;
  handleNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <NodeSection label="Configuration">
      <NodeField id="config_name" color={colors.gray400}>
        <Row style={{ width: "100%", height: "100%", alignItems: "stretch" }}>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              fontSize: "10px",
              color: colors.gray600,
              width: "60px",
              textAlign: "right",
              paddingRight: "6px",
              boxSizing: "border-box",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            name
          </span>
          <Input
            type="text"
            placeholder="Step name..."
            value={stepName}
            onChange={handleNameChange}
            style={{
              flex: 1,
              boxSizing: "border-box",
              height: "100%",
              fontSize: "11px",
              margin: 0,
              padding: "0 6px",
            }}
          />
        </Row>
      </NodeField>
    </NodeSection>
  );
}

function PropsSection({
  propEntries,
  handlePropChange,
}: {
  propEntries: [string, string][];
  handlePropChange: (k: string, v: string) => void;
}) {
  if (propEntries.length === 0) return null;
  return (
    <NodeSection label="Props" color={colors.violet400}>
      {propEntries.map(([key, value]) => (
        <NodeField key={key} id={`prop-${key}`} color={colors.violet400}>
          <Row style={{ width: "100%", height: "100%", alignItems: "stretch" }}>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                fontSize: "10px",
                color: colors.gray600,
                width: "60px",
                textAlign: "right",
                paddingRight: "6px",
                boxSizing: "border-box",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {key}
            </span>
            <Input
              type="text"
              placeholder={`${key}...`}
              value={value}
              onChange={(e) => handlePropChange(key, e.target.value)}
              style={{
                flex: 1,
                boxSizing: "border-box",
                height: "100%",
                fontSize: "10px",
                margin: 0,
                padding: "0 6px",
              }}
            />
          </Row>
        </NodeField>
      ))}
    </NodeSection>
  );
}

function SpecsSection({
  specs,
  handleSpecChange,
}: {
  specs: Record<string, unknown>;
  handleSpecChange: (k: string, v: unknown) => void;
}) {
  if (Object.entries(specs).length === 0) return null;
  return (
    <NodeSection label="Specs" color={colors.cyan400}>
      {Object.entries(specs).map(([key, value]) => (
        <NodeField key={key} id={`spec-${key}`} color={colors.cyan400}>
          <Row
            style={{
              width: "100%",
              height: "100%",
              alignItems: "stretch",
              padding: "0px 5px",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                fontSize: "10px",
                color: colors.gray600,
                textAlign: "right",
                paddingRight: "6px",
                boxSizing: "border-box",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {key}
            </span>
            {typeof value === "boolean" ? (
              <input
                type="checkbox"
                checked={value}
                onChange={() => handleSpecChange(key, !value)}
                className="nodrag"
                style={{
                  boxSizing: "border-box",
                  height: "100%",
                  accentColor: colors.cyan600,
                  cursor: "pointer",
                  margin: 0,
                }}
              />
            ) : (
              <Input
                type="text"
                value={String(value)}
                onChange={(e) => handleSpecChange(key, e.target.value)}
                style={{
                  width: "60%",
                  boxSizing: "border-box",
                  height: "100%",
                  fontSize: "10px",
                  margin: 0,
                  padding: "0 6px",
                }}
              />
            )}
          </Row>
        </NodeField>
      ))}
    </NodeSection>
  );
}

function FieldsSection({ fields }: { fields: string[] }) {
  if (fields.length === 0) return null;
  return (
    <NodeSection label="Data Fields" color={colors.amber400}>
      {fields.map((field) => (
        <NodeField
          key={field}
          color={colors.amber400}
          leftHandle="fieldSource"
          rightHandle="fieldSource"
          leftId={`l-field-${field}`}
          rightId={`r-field-${field}`}
        >
          <Row
            style={{
              width: "100%",
              height: "100%",
              alignItems: "stretch",
              padding: "1px",
            }}
          >
            <div
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                fontSize: "11px",
                color: colors.gray800,
                fontWeight: 500,
                boxSizing: "border-box",
              }}
            >
              {field}
            </div>
          </Row>
        </NodeField>
      ))}
    </NodeSection>
  );
}

function ConditionsSection({
  outputs,
  hideOutputs,
  addOutput,
  updateOutput,
  removeOutput,
}: {
  outputs: OutputConfig[];
  hideOutputs?: boolean;
  addOutput: () => void;
  updateOutput: (idx: number, k: keyof OutputConfig, v: string) => void;
  removeOutput: (idx: number) => void;
}) {
  if (hideOutputs) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Label style={{ color: colors.gray400, fontSize: "11px", margin: 0 }}>
          Conditions
        </Label>
        <Button
          onClick={addOutput}
          variant="primary"
          size="sm"
          style={{ padding: "2px 4px", fontSize: "10px", height: "auto" }}
          type="button"
        >
          + Add
        </Button>
      </div>

      {outputs.map((out, index) => (
        <NodeField
          key={out.id}
          color={colors.gray400}
          leftHandle="fieldTarget"
          rightHandle="flowSource"
          leftId={`target-${out.id}`}
          rightId={out.id}
        >
          <Row
            style={{
              width: "100%",
              height: "100%",
              alignItems: "stretch",
              padding: "0px 10px",
              gap: "4px",
            }}
          >
            <Select
              value={out.operator}
              onChange={(e) => updateOutput(index, "operator", e.target.value)}
              style={{
                boxSizing: "border-box",
                height: "100%",
                fontSize: "10px",
                padding: "0 4px",
                width: "45px",
                margin: 0,
              }}
            >
              <option value="eq">==</option>
              <option value="neq">!=</option>
              <option value="gt">&gt;</option>
              <option value="lt">&lt;</option>
            </Select>
            <Input
              type="text"
              placeholder="Value"
              value={out.value}
              onChange={(e) => updateOutput(index, "value", e.target.value)}
              style={{
                flex: 1,
                boxSizing: "border-box",
                height: "100%",
                fontSize: "10px",
                minWidth: "50px",
                margin: 0,
                padding: "0 6px",
              }}
            />
            <Button
              onClick={() => removeOutput(index)}
              variant="ghost"
              size="sm"
              style={{
                boxSizing: "border-box",
                padding: "0 4px",
                color: colors.red500,
                minWidth: "auto",
                height: "100%",
                margin: 0,
              }}
              type="button"
            >
              ✕
            </Button>
          </Row>
        </NodeField>
      ))}

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
            padding: "0px 10px",
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
              paddingRight: "4px",
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

// --- Main Node Export --- //

export function StepNode({
  id,
  data,
  accentColor = colors.gray500,
  children,
}: StepNodeProps) {
  const { updateNodeData } = useReactFlow();

  const stepName = data.stepName || "";
  const outputs = data.outputs || [];
  const fields = data.fields || [];
  const props = data.props || {};
  const specs = data.specs || {};
  const propEntries = Object.entries(props) as [string, string][];

  const handleSpecChange = (key: string, value: unknown) => {
    const updatedSpecs = { ...specs, [key]: value };
    const patch: Record<string, unknown> = { specs: updatedSpecs };
    if (key === "stopWorkflow") patch.hideOutputs = Boolean(value);
    updateNodeData(id, patch);
  };

  const handlePropChange = (key: string, value: string) => {
    updateNodeData(id, { props: { ...props, [key]: value } });
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
    val: string,
  ) => {
    const updated = [...outputs];
    updated[index] = { ...updated[index], [key]: val };
    updateNodeData(id, { outputs: updated });
  };

  const removeOutput = (index: number) => {
    updateNodeData(id, { outputs: outputs.filter((_, i) => i !== index) });
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateNodeData(id, { stepName: e.target.value });
  };

  return (
    <Card
      style={{
        ...cardStyle,
        minWidth: "320px",
        border: `1px solid ${accentColor}`,
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

      <div style={cardHeaderStyle(accentColor)}>
        <div>{data.execution.type}</div>
        <ExecutionBadge mode={data.execution.mode} />
      </div>

      <div
        style={{
          padding: "8px 10px",
          display: "flex",
          flexDirection: "column",
          gap: "15px",
        }}
      >
        <ConfigurationSection
          stepName={stepName}
          handleNameChange={handleNameChange}
        />
        <PropsSection
          propEntries={propEntries}
          handlePropChange={handlePropChange}
        />
        <SpecsSection specs={specs} handleSpecChange={handleSpecChange} />
        <FieldsSection fields={fields} />
        {children}
        <ConditionsSection
          outputs={outputs}
          hideOutputs={data.hideOutputs}
          addOutput={addOutput}
          updateOutput={updateOutput}
          removeOutput={removeOutput}
        />
      </div>
    </Card>
  );
}
