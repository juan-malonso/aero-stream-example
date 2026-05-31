'use client';

import type { Edge, Node } from '@xyflow/react';
import type { AeroStreamComponentParams } from 'aero-stream-pilot';
import React, { useEffect, useMemo, useState } from 'react';

import { getLiveStepByExecutionType, type StepNodeData } from '@/aero-stream-example-library';
import { Button, Column, Row } from '@/components/ui';
import { useWorkflowGraph } from '@/contexts/shared/workflow/useWorkflow';
import { colors, typography } from '@/styles/tokens';

interface WorkflowStepPanelProperties {
  onSelectStep: (stepId: string | null) => void;
  selectedStepId: string | null;
}

type CodeFormat = 'json' | 'ts';

const MOCK_HYDRATION_DEFAULT_VALUE = "'???'";

interface EditorScrollPosition {
  left: number;
  top: number;
}

interface EditorSelectionRange {
  end: number;
  start: number;
}

interface ImportBrowserPosition {
  left: number;
  top: number;
}

interface PreviewAction {
  emitted: 'reject' | 'submit';
  value: unknown;
}

export function WorkflowStepPanel({
  onSelectStep,
  selectedStepId,
}: WorkflowStepPanelProperties) {
  const { nodes } = useWorkflowGraph();
  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedStepId),
    [nodes, selectedStepId],
  );

  return (
    <Column align="stretch" gap="0" style={panelStyle}>
      {selectedNode ? (
        <SelectedStepPanel onSelectStep={onSelectStep} selectedNode={selectedNode} />
      ) : (
        <EmptyPanel />
      )}
    </Column>
  );
}

function SelectedStepPanel({
  onSelectStep,
  selectedNode,
}: {
  onSelectStep: (stepId: string | null) => void;
  selectedNode: Node;
}) {
  const { edges, nodes, setNodes } = useWorkflowGraph();
  const stepData = selectedNode.data as unknown as StepNodeData;
  const [inputText, setInputText] = useState('');
  const [codeText, setCodeText] = useState('');
  const [isImportBrowserOpen, setIsImportBrowserOpen] = useState(false);
  const [importBrowserMode, setImportBrowserMode] = useState<ImportBrowserMode>('copy');
  const [importBrowserPane, setImportBrowserPane] = useState<ImportBrowserPane>('root');
  const [importBrowserPosition, setImportBrowserPosition] = useState({ left: 0, top: 0 });
  const [bindingEditRange, setBindingEditRange] = useState<EditorSelectionRange | null>(null);
  const [selectedImportStepId, setSelectedImportStepId] = useState<string | null>(null);
  const [isMockHydrationOpen, setIsMockHydrationOpen] = useState(false);
  const [mockHydrationPosition, setMockHydrationPosition] = useState({ left: 0, top: 0 });
  const [mockHydrationValues, setMockHydrationValues] = useState<Record<string, string>>({});
  const [outputText, setOutputText] = useState(formatJson({ status: 'idle' }));
  const [previewAction, setPreviewAction] = useState<PreviewAction | null>(null);

  useEffect(() => {
    setInputText(formatJson(stepData.props ?? {}));
    setCodeText(formatStepCodeSource(stepData.code?.source ?? ''));
    setBindingEditRange(null);
    setImportBrowserMode('copy'); setImportBrowserPane('root');
    setIsImportBrowserOpen(false);
    setSelectedImportStepId(null); setIsMockHydrationOpen(false); setMockHydrationValues({});
    setOutputText(formatJson({ status: 'idle' }));
    setPreviewAction(null);
  }, [selectedNode.id]);

  const parsedInput = useMemo(() => parseJsonObject(inputText), [inputText]);
  const hasCode = Boolean(stepData.code);
  const mockHydrationReferences = useMemo(() => extractMockHydrationReferences(inputText), [inputText]);
  const hydratedInputValue = useMemo(
    () => parsedInput.ok
      ? hydrateMockBindings(parsedInput.value, mockHydrationValues)
      : {},
    [mockHydrationValues, parsedInput],
  );
  const previousSteps = useMemo(() => buildPreviousStepImports(nodes, edges, selectedNode.id), [edges, nodes, selectedNode.id]);
  const bindingValidation = useMemo(
    () => validateBindings(inputText, previousSteps),
    [inputText, previousSteps],
  );
  const activeBindingValue = bindingEditRange ? inputText.slice(bindingEditRange.start, bindingEditRange.end) : null;

  useEffect(() => {
    if (mockHydrationReferences.length === 0) setIsMockHydrationOpen(false);
    setMockHydrationValues(currentValues =>
      syncMockHydrationValues(currentValues, mockHydrationReferences),
    );
  }, [mockHydrationReferences]);

  const updateSelectedStepData = (data: Partial<StepNodeData>) => {
    updateStepNodeData(setNodes, selectedNode.id, data);
  };

  const handleInputTextChange = (
    value: string,
    selection?: EditorSelectionRange,
    position?: ImportBrowserPosition,
  ) => {
    setInputText(value);
    const parsed = parseJsonObject(value);
    if (parsed.ok) {
      updateSelectedStepData({ props: toStringRecord(parsed.value) });
    }

    if (selection) openBindingBrowserFromSelection(value, selection, position);
  };

  const handleCodeTextChange = (value: string) => {
    setCodeText(value);
    if (stepData.code) {
      updateSelectedStepData({ code: { ...stepData.code, source: value } });
    }
  };

  const applyInputBinding = (key: string, value: string) => {
    if (bindingEditRange) {
      const nextText = [
        inputText.slice(0, bindingEditRange.start),
        value,
        inputText.slice(bindingEditRange.end),
      ].join('');

      setInputText(nextText);
      setBindingEditRange({ end: bindingEditRange.start + value.length, start: bindingEditRange.start });
      updateInputFromText(nextText);
      return;
    }

    const parsed = parseJsonObject(inputText);
    const nextInput = {
      ...(parsed.ok ? parsed.value : {}),
      [nextAvailableKey(parsed.ok ? parsed.value : {}, key)]: value,
    };
    const nextText = formatJson(nextInput);
    setInputText(nextText);
    updateSelectedStepData({ props: toStringRecord(nextInput) });
  };

  const copyInputBinding = (value: string) => { void navigator.clipboard?.writeText(value); };

  const handlePreviewAction = (action: PreviewAction) => {
    setPreviewAction(action);
    setOutputText(formatJson(action));
  };

  const evaluateConditions = () => {
    if (!previewAction) return;

    const nextStepId = resolveNextStepId({
      edges, inputValue: parsedInput.ok ? parsedInput.value : {}, previewAction, selectedNodeId: selectedNode.id, stepData,
    });

    if (nextStepId) onSelectStep(nextStepId);
  };

  const openBindingBrowserFromSelection = (
    value: string,
    selection: EditorSelectionRange,
    position?: ImportBrowserPosition,
  ) => {
    const bindingRange = findBindingRange(value, selection);
    if (!bindingRange) return;

    const bindingValue = value.slice(bindingRange.start, bindingRange.end);
    const bindingPath = parseBindingPath(bindingValue);

    setBindingEditRange(bindingRange);
    if (position && !isImportBrowserOpen) setImportBrowserPosition(position);
    setImportBrowserMode('replace');
    setIsImportBrowserOpen(true);
    setImportBrowserPane(bindingPath.pane);
    setSelectedImportStepId(bindingPath.stepId);
  };

  const updateInputFromText = (value: string) => {
    const parsed = parseJsonObject(value);
    if (parsed.ok) updateSelectedStepData({ props: toStringRecord(parsed.value) });
  };

  const openCopyImportBrowser = (position: ImportBrowserPosition) => {
    if (!isImportBrowserOpen) setImportBrowserPosition(position);
    setIsImportBrowserOpen(current => !current);
    setBindingEditRange(null);
    setImportBrowserMode('copy'); setImportBrowserPane('root'); setSelectedImportStepId(null);
  };

  const openMockHydration = (position: ImportBrowserPosition) => {
    if (mockHydrationReferences.length === 0) return;

    setMockHydrationPosition(position);
    setIsMockHydrationOpen(current => !current);
  };

  return (
    <>
      <InputsPanel
        activeBindingValue={activeBindingValue} bindingValidation={bindingValidation}
        importBrowserMode={importBrowserMode} importBrowserPane={importBrowserPane}
        importBrowserPosition={importBrowserPosition} inputText={inputText}
        isImportBrowserOpen={isImportBrowserOpen} jsonError={!parsedInput.ok}
        onChange={handleInputTextChange}
        onCloseImportBrowser={() => { setIsImportBrowserOpen(false); }}
        onCopy={copyInputBinding} onInsert={applyInputBinding}
        onOpenImports={openCopyImportBrowser} onSelectPane={setImportBrowserPane}
        onSelectStep={setSelectedImportStepId}
        onSelectionChange={openBindingBrowserFromSelection}
        previousSteps={previousSteps} selectedImportStepId={selectedImportStepId}
      />

      <PreviewPanel
        codeText={codeText} hasCode={hasCode} inputValue={hydratedInputValue}
        isMockHydrationOpen={isMockHydrationOpen} mockHydrationPosition={mockHydrationPosition}
        mockHydrationReferences={mockHydrationReferences} mockHydrationValues={mockHydrationValues}
        onCodeChange={handleCodeTextChange}
        onCloseMockHydration={() => { setIsMockHydrationOpen(false); }}
        onMockHydrationChange={(reference, value) => {
          setMockHydrationValues(currentValues => ({ ...currentValues, [reference]: value }));
        }}
        onOpenMockHydration={openMockHydration} onPreviewAction={handlePreviewAction}
        stepData={stepData}
      />

      <OutputPanel
        canEvaluateConditions={previewAction !== null} onEvaluateConditions={evaluateConditions}
        value={parsedInput.ok ? outputText : formatJson({ error: parsedInput.error })}
      />
    </>
  );
}

function updateStepNodeData(
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>,
  selectedNodeId: string,
  data: Partial<StepNodeData>,
) {
  setNodes((currentNodes) => currentNodes.map((node) => {
    if (node.id !== selectedNodeId) return node;

    const currentData = node.data as unknown as StepNodeData;
    return {
      ...node,
      data: {
        ...currentData,
        ...data,
      } as unknown as Record<string, unknown>,
    };
  }));
}

function InputsPanel(properties: React.ComponentProps<typeof InputEditorArea> & {
  jsonError: boolean;
  onOpenImports: (position: ImportBrowserPosition) => void;
}) {
  const { jsonError, onOpenImports, ...editorProperties } = properties;

  return (
    <PanelSection
      action={<InputImportsButton onClick={onOpenImports} />}
      alert={jsonError ? <span style={jsonInvalidBadgeStyle}>JSON invalido</span> : null}
      format="json"
      title="Inputs"
      weight={0.25}
    >
      <InputEditorArea {...editorProperties} />
    </PanelSection>
  );
}

function InputEditorArea({
  activeBindingValue,
  bindingValidation,
  importBrowserMode,
  importBrowserPane,
  importBrowserPosition,
  inputText,
  isImportBrowserOpen,
  onChange,
  onCloseImportBrowser,
  onCopy,
  onInsert,
  onSelectPane,
  onSelectStep,
  onSelectionChange,
  previousSteps,
  selectedImportStepId,
}: {
  activeBindingValue: string | null;
  bindingValidation: ReturnType<typeof validateBindings>;
  importBrowserMode: ImportBrowserMode;
  importBrowserPane: ImportBrowserPane;
  importBrowserPosition: ImportBrowserPosition;
  inputText: string;
  isImportBrowserOpen: boolean;
  onChange: (
    value: string,
    selection?: EditorSelectionRange,
    position?: ImportBrowserPosition,
  ) => void;
  onCloseImportBrowser: () => void;
  onCopy: (value: string) => void;
  onInsert: (key: string, value: string) => void;
  onSelectPane: (pane: ImportBrowserPane) => void;
  onSelectStep: (stepId: string | null) => void;
  onSelectionChange: (
    value: string,
    selection: EditorSelectionRange,
    position?: ImportBrowserPosition,
  ) => void;
  previousSteps: StepImportOption[];
  selectedImportStepId: string | null;
}) {
  return (
    <div style={inputPanelBodyStyle}>
      <CodePanel
        editable
        format="json"
        invalidRanges={bindingValidation.invalidRanges}
        onChange={onChange}
        onSelectionChange={onSelectionChange}
        value={inputText}
      />
      {bindingValidation.message ? (
        <div style={bindingErrorStyle}>{bindingValidation.message}</div>
      ) : null}
      {isImportBrowserOpen ? (
        <InputImportBrowser
          activeValue={activeBindingValue}
          mode={importBrowserMode}
          onClose={onCloseImportBrowser}
          onCopy={onCopy}
          onInsert={onInsert}
          onSelectPane={onSelectPane}
          onSelectStep={onSelectStep}
          pane={importBrowserPane}
          previousSteps={previousSteps}
          position={importBrowserPosition}
          selectedStepId={selectedImportStepId}
        />
      ) : null}
    </div>
  );
}

function InputImportsButton({
  onClick,
}: {
  onClick: (position: ImportBrowserPosition) => void;
}) {
  return (
    <button
      aria-label="Input imports"
      onClick={(event) => {
        onClick(positionFromMouseEvent(event));
      }}
      style={infoButtonStyle}
      type="button"
    >
      i
    </button>
  );
}

function PreviewPanel({
  codeText,
  hasCode,
  inputValue,
  isMockHydrationOpen,
  mockHydrationPosition,
  mockHydrationReferences,
  mockHydrationValues,
  onCodeChange,
  onCloseMockHydration,
  onMockHydrationChange,
  onOpenMockHydration,
  onPreviewAction,
  stepData,
}: {
  codeText: string;
  hasCode: boolean;
  inputValue: Record<string, unknown>;
  isMockHydrationOpen: boolean;
  mockHydrationPosition: ImportBrowserPosition;
  mockHydrationReferences: string[];
  mockHydrationValues: Record<string, string>;
  onCodeChange: (value: string) => void;
  onCloseMockHydration: () => void;
  onMockHydrationChange: (reference: string, value: string) => void;
  onOpenMockHydration: (position: ImportBrowserPosition) => void;
  onPreviewAction: (action: PreviewAction) => void;
  stepData: StepNodeData;
}) {
  return (
    <PanelSection
      action={(
        <Button
          disabled={mockHydrationReferences.length === 0}
          onClick={(event) => {
            onOpenMockHydration(positionFromMouseEvent(event));
          }}
          size="sm"
          style={{
            ...mockHydrationButtonStyle,
            ...(mockHydrationReferences.length === 0 ? mockHydrationDisabledButtonStyle : {}),
          }}
          type="button"
          variant={mockHydrationReferences.length > 0 ? 'primary' : 'ghost'}
        >
          Mock hydration
        </Button>
      )}
      format={hasCode ? 'ts' : undefined}
      title="Preview"
      weight={0.47}
    >
      {isMockHydrationOpen ? (
        <MockHydrationMenu
          onChange={onMockHydrationChange}
          onClose={onCloseMockHydration}
          position={mockHydrationPosition}
          references={mockHydrationReferences}
          values={mockHydrationValues}
        />
      ) : null}
      {hasCode ? (
        <CodePreviewPanel
          codeText={codeText}
          inputValue={inputValue}
          onChange={onCodeChange}
          onPreviewAction={onPreviewAction}
          stepData={stepData}
        />
      ) : (
        <StepPreview
          inputValue={inputValue}
          onPreviewAction={onPreviewAction}
          stepData={stepData}
        />
      )}
    </PanelSection>
  );
}

function CodePreviewPanel({
  codeText,
  inputValue,
  onChange,
  onPreviewAction,
  stepData,
}: {
  codeText: string;
  inputValue: Record<string, unknown>;
  onChange: (value: string) => void;
  onPreviewAction: (action: PreviewAction) => void;
  stepData: StepNodeData;
}) {
  const [runError, setRunError] = useState<string | null>(null);

  const runPreviewCode = async () => {
    try {
      const result = await executePreviewCode({
        inputValue,
        source: codeText,
        stepData,
      });

      setRunError(null);
      onPreviewAction({
        emitted: 'submit',
        value: normalizePreviewCodeResult(result),
      });
    } catch (error) {
      setRunError(formatPreviewCodeError(error));
    }
  };

  return (
    <div style={codePreviewPanelStyle}>
      <CodePanel
        editable
        format="ts"
        onChange={onChange}
        value={codeText}
      />
      {runError ? (
        <div style={codePreviewErrorBannerStyle}>
          <button
            aria-label="Cerrar error"
            onClick={() => { setRunError(null); }}
            style={codePreviewErrorCloseStyle}
            type="button"
          >
            X
          </button>
          <pre style={codePreviewErrorTextStyle}>{runError}</pre>
        </div>
      ) : null}
      <Button
        onClick={() => { void runPreviewCode(); }}
        size="sm"
        style={codePreviewPlayButtonStyle}
        type="button"
        variant="primary"
      >
        Play
      </Button>
    </div>
  );
}

function MockHydrationMenu({
  onChange,
  onClose,
  position,
  references,
  values,
}: {
  onChange: (reference: string, value: string) => void;
  onClose: () => void;
  position: ImportBrowserPosition;
  references: string[];
  values: Record<string, string>;
}) {
  return (
    <div onMouseDown={onClose} style={importBrowserOverlayStyle}>
      <Column
        align="stretch"
        gap="0.5rem"
        onMouseDown={(event) => { event.stopPropagation(); }}
        style={{
          ...mockHydrationMenuStyle,
          left: position.left,
          top: position.top,
        }}
      >
        {references.map(reference => (
          <Column align="stretch" gap="0.25rem" key={reference}>
            <div style={mockHydrationReferenceStyle}>{reference}</div>
            <input
              onChange={(event) => { onChange(reference, event.target.value); }}
              style={mockHydrationInputStyle}
              type="text"
              value={values[reference] ?? MOCK_HYDRATION_DEFAULT_VALUE}
            />
          </Column>
        ))}
      </Column>
    </div>
  );
}

function OutputPanel({
  canEvaluateConditions,
  onEvaluateConditions,
  value,
}: {
  canEvaluateConditions: boolean;
  onEvaluateConditions: () => void;
  value: string;
}) {
  return (
    <PanelSection
      action={(
        <Button
          disabled={!canEvaluateConditions}
          onClick={onEvaluateConditions}
          size="sm"
          style={{
            ...evaluateConditionButtonStyle,
            ...(!canEvaluateConditions ? evaluateConditionDisabledButtonStyle : {}),
          }}
          type="button"
          variant={canEvaluateConditions ? 'primary' : 'ghost'}
        >
          Evaluate condition
        </Button>
      )}
      format="json"
      title="Output"
      weight={0.28}
    >
      <CodePanel
        format="json"
        value={value}
      />
    </PanelSection>
  );
}

function StepPreview({
  inputValue,
  onPreviewAction,
  stepData,
}: {
  inputValue: Record<string, unknown>;
  onPreviewAction: (action: PreviewAction) => void;
  stepData: StepNodeData;
}) {
  const liveStep = getLiveStepByExecutionType(stepData.execution.type);

  if (!liveStep) {
    return (
      <div style={emptyPreviewStyle}>
        No preview for {stepData.execution.type}
      </div>
    );
  }

  const parameters: AeroStreamComponentParams = {
    canvas: createPreviewCanvas,
    data: inputValue,
    reject: (value?: unknown) => {
      onPreviewAction({ emitted: 'reject', value: value ?? {} });
    },
    stream: createPreviewStream,
    submit: (value?: unknown) => {
      onPreviewAction({ emitted: 'submit', value: value ?? {} });
    },
  };

  return (
    <div style={previewViewportStyle}>
      <div style={previewSurfaceStyle}>
        {liveStep.render(parameters)}
      </div>
    </div>
  );
}

function PanelSection({
  action,
  alert,
  children,
  format,
  title,
  weight,
}: {
  action?: React.ReactNode;
  alert?: React.ReactNode;
  children: React.ReactNode;
  format?: CodeFormat;
  title: string;
  weight: number;
}) {
  return (
    <Column
      align="stretch"
      gap="0"
      style={{
        borderBottom: `1px solid ${colors.gray200}`,
        flex: weight,
        minHeight: 0,
      }}
    >
      <Row align="center" justify="space-between" style={sectionHeaderStyle}>
        <Row align="center" gap="0.5rem" style={{ minWidth: 0 }}>
          <div style={sectionTitleStyle}>{title}</div>
          {alert}
        </Row>
        <Row align="center" gap="0.5rem" style={sectionHeaderActionsStyle}>
          {format ? (
            <span style={formatBadgeStyle}>{format.toUpperCase()}</span>
          ) : null}
          {action}
        </Row>
      </Row>
      <div style={sectionBodyStyle}>{children}</div>
    </Column>
  );
}

type ImportBrowserPane = 'envs' | 'root' | 'steps';
type ImportBrowserMode = 'copy' | 'replace';

interface StepImportOption {
  fields: string[];
  id: string;
  name: string;
}

function InputImportBrowser({
  activeValue,
  mode,
  onClose,
  onCopy,
  onInsert,
  onSelectPane,
  onSelectStep,
  pane,
  previousSteps,
  position,
  selectedStepId,
}: {
  activeValue: string | null;
  mode: ImportBrowserMode;
  onClose: () => void;
  onCopy: (value: string) => void;
  onInsert: (key: string, value: string) => void;
  onSelectPane: (pane: ImportBrowserPane) => void;
  onSelectStep: (stepId: string | null) => void;
  pane: ImportBrowserPane;
  previousSteps: StepImportOption[];
  position: ImportBrowserPosition;
  selectedStepId: string | null;
}) {
  const selectedStep = previousSteps.find(step => step.id === selectedStepId);
  const selectedStepResultBinding = selectedStep ? `{{steps.${selectedStep.id}.result}}` : '';
  const selectedStepResultPrefix = selectedStep ? `{{steps.${selectedStep.id}.result` : '';

  return (
    <div onMouseDown={onClose} style={importBrowserOverlayStyle}>
      <div
        onMouseDown={(event) => { event.stopPropagation(); }}
        style={{
          ...importBrowserStyle,
          left: position.left,
          top: position.top,
        }}
      >
        <div style={importBrowserColumnsStyle}>
        <Column align="stretch" gap="0.25rem" style={importBrowserColumnStyle}>
          <ImportFolderButton
            hasChildren={previousSteps.length > 0}
            isSelected={pane === 'steps'}
            label="steps"
            onClick={() => {
              if (previousSteps.length === 0) return;

              onSelectPane('steps');
              onSelectStep(null);
            }}
          />
          <ImportFolderButton
            hasChildren
            isSelected={pane === 'envs'}
            label="envs"
            onClick={() => {
              onSelectPane('envs');
              onSelectStep(null);
            }}
          />
        </Column>

        {pane === 'steps' ? (
          <Column align="stretch" gap="0.25rem" style={importBrowserColumnStyle}>
            {previousSteps.length === 0 ? (
              <div style={importEmptyStyle}>Sin steps previos</div>
            ) : previousSteps.map(step => (
              <StepImportButton
                hasChildren
                isSelected={step.id === selectedStepId}
                key={step.id}
                onClick={() => { onSelectStep(step.id); }}
                step={step}
              />
            ))}
          </Column>
        ) : null}

        {pane === 'steps' && selectedStep ? (
          <Column align="stretch" gap="0.25rem" style={importBrowserColumnStyle}>
            <ImportValueButton
              actionLabel={mode === 'copy' ? 'Copiar' : 'Usar'}
              hasChildren={selectedStep.fields.length > 0}
              isSelected={activeValue?.startsWith(selectedStepResultPrefix) ?? false}
              label="result"
              onClick={() => {
                if (mode === 'copy') {
                  onCopy(selectedStepResultBinding);
                  return;
                }

                onInsert(`${toInputKey(selectedStep.name)}Result`, selectedStepResultBinding);
              }}
            />
          </Column>
        ) : null}

        {pane === 'steps' && selectedStep && selectedStep.fields.length > 0 ? (
          <Column align="stretch" gap="0.25rem" style={importBrowserColumnStyle}>
            {selectedStep.fields.map(field => (
              <ImportValueButton
                actionLabel={mode === 'copy' ? 'Copiar' : 'Usar'}
                hasChildren={false}
                isSelected={activeValue === `{{steps.${selectedStep.id}.result.${field}}}`}
                key={field}
                label={field}
                onClick={() => {
                  const binding = `{{steps.${selectedStep.id}.result.${field}}}`;
                  if (mode === 'copy') {
                    onCopy(binding);
                    return;
                  }

                  onInsert(field, binding);
                }}
              />
            ))}
          </Column>
        ) : null}

        {pane === 'envs' ? (
          <Column align="stretch" gap="0.25rem" style={importBrowserColumnStyle}>
            <ImportValueButton
              actionLabel={mode === 'copy' ? 'Copiar' : 'Usar'}
              hasChildren={false}
              isSelected={activeValue === '{{env.allowedOrigins}}'}
              label="allowedOrigins"
              onClick={() => {
                const binding = '{{env.allowedOrigins}}';
                if (mode === 'copy') {
                  onCopy(binding);
                  return;
                }

                onInsert('allowedOrigins', binding);
              }}
            />
            <ImportValueButton
              actionLabel={mode === 'copy' ? 'Copiar' : 'Usar'}
              hasChildren={false}
              isSelected={activeValue === '{{env.secret}}'}
              label="secret"
              onClick={() => {
                const binding = '{{env.secret}}';
                if (mode === 'copy') {
                  onCopy(binding);
                  return;
                }

                onInsert('secret', binding);
              }}
            />
          </Column>
        ) : null}
        </div>
      </div>
    </div>
  );
}

function ImportFolderButton({
  hasChildren,
  isSelected,
  label,
  onClick,
}: {
  hasChildren: boolean;
  isSelected: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      disabled={!hasChildren}
      onClick={onClick}
      style={{
        ...importBrowserRowButtonStyle,
        ...(!hasChildren ? importBrowserDisabledRowStyle : {}),
        ...(isSelected ? importBrowserSelectedRowStyle : {}),
      }}
      type="button"
    >
      <span>{label}</span>
      {hasChildren ? <span style={importChevronStyle}>›</span> : null}
    </button>
  );
}

function StepImportButton({
  hasChildren,
  isSelected,
  onClick,
  step,
}: {
  hasChildren: boolean;
  isSelected: boolean;
  onClick: () => void;
  step: StepImportOption;
}) {
  return (
    <button
      disabled={!hasChildren}
      onClick={onClick}
      style={{
        ...stepImportButtonStyle,
        ...(!hasChildren ? importBrowserDisabledRowStyle : {}),
        ...(isSelected ? importBrowserSelectedRowStyle : {}),
      }}
      type="button"
    >
      <span style={stepImportNameStyle}>{step.name}</span>
      {hasChildren ? <span style={importChevronStyle}>›</span> : null}
      {isSelected ? <span style={stepImportIdStyle}>{step.id}</span> : null}
    </button>
  );
}

function ImportValueButton({
  actionLabel,
  hasChildren,
  isSelected,
  label,
  onClick,
}: {
  actionLabel: string;
  hasChildren: boolean;
  isSelected: boolean;
  label: string;
  onClick: () => void;
}) {
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!isCopied) return undefined;

    const timeoutId = window.setTimeout(() => {
      setIsCopied(false);
    }, 1800);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isCopied]);

  const handleActionClick = () => {
    onClick();
    if (actionLabel === 'Copiar') setIsCopied(true);
  };

  return (
    <div
      style={{
        ...importValueButtonStyle,
        ...(isSelected ? importBrowserSelectedRowStyle : {}),
        ...(isCopied ? importBrowserCopiedRowStyle : {}),
      }}
    >
      <span style={importValueLabelStyle}>{label}</span>
      <Row align="center" gap="0.125rem" style={importValueActionsStyle}>
        <button onClick={handleActionClick} style={importValueActionStyle} type="button">
          {actionLabel === 'Copiar' ? 'Copy' : 'Use'}
        </button>
        {hasChildren ? <span style={importChevronStyle}>›</span> : null}
      </Row>
    </div>
  );
}

function CodePanel({
  editable = false,
  format,
  invalidRanges = [],
  onChange,
  onSelectionChange,
  value,
}: {
  editable?: boolean;
  format: CodeFormat;
  invalidRanges?: EditorSelectionRange[];
  onChange?: (
    value: string,
    selection: EditorSelectionRange,
    position?: ImportBrowserPosition,
  ) => void;
  onSelectionChange?: (
    value: string,
    selection: EditorSelectionRange,
    position?: ImportBrowserPosition,
  ) => void;
  value: string;
}) {
  const [scrollPosition, setScrollPosition] = useState({
    left: 0,
    top: 0,
  } satisfies EditorScrollPosition);
  const lines = useMemo(() => value.split('\n'), [value]);

  if (!editable) {
    return (
      <div style={readOnlyEditorStyle}>
        <div style={readOnlyLineNumberColumnStyle}>
          {lines.map((_, index) => (
            <div key={`line-${index + 1}`} style={lineNumberStyle}>
              {index + 1}
            </div>
          ))}
        </div>
        <pre style={highlightSurfaceStyle}>
          {highlightCode(value, format, invalidRanges)}
        </pre>
      </div>
    );
  }

  const emitSelection = (
    element: HTMLTextAreaElement,
    position?: ImportBrowserPosition,
  ) => {
    onSelectionChange?.(element.value, {
      end: element.selectionEnd,
      start: element.selectionStart,
    }, position ?? positionFromTextareaCaret(element));
  };

  return (
    <div style={codePanelStyle}>
      <div aria-hidden style={editorPresentationStyle}>
        <div
          style={{
            ...lineNumberColumnStyle,
            transform: `translateY(-${scrollPosition.top}px)`,
          }}
        >
          {lines.map((_, index) => (
            <div key={`line-${index + 1}`} style={lineNumberStyle}>
              {index + 1}
            </div>
          ))}
        </div>
        <pre
          style={{
            ...highlightSurfaceStyle,
            transform: `translate(-${scrollPosition.left}px, -${scrollPosition.top}px)`,
          }}
        >
          {highlightCode(value, format, invalidRanges)}
        </pre>
      </div>
      <textarea
        aria-label={`${format.toUpperCase()} editor`}
        onChange={(event) => {
          onChange?.(event.currentTarget.value, {
            end: event.currentTarget.selectionEnd,
            start: event.currentTarget.selectionStart,
          }, positionFromTextareaCaret(event.currentTarget));
        }}
        onClick={(event) => {
          emitSelection(event.currentTarget, positionFromMouseEvent(event));
        }}
        onKeyUp={(event) => { emitSelection(event.currentTarget); }}
        onScroll={(event) => {
          setScrollPosition({
            left: event.currentTarget.scrollLeft,
            top: event.currentTarget.scrollTop,
          });
        }}
        onSelect={(event) => { emitSelection(event.currentTarget); }}
        spellCheck={false}
        style={editorTextareaStyle}
        value={value}
        wrap="off"
      />
    </div>
  );
}

function highlightCode(
  value: string,
  format: CodeFormat,
  invalidRanges: EditorSelectionRange[] = [],
): React.ReactNode[] {
  const bindingRanges = normalizeRanges(extractBindingRanges(value), value.length);

  if (bindingRanges.length === 0) {
    return highlightCodeSegment(value, format);
  }

  const nodes: React.ReactNode[] = [];
  const normalizedInvalidRanges = normalizeRanges(invalidRanges, value.length);
  let cursor = 0;

  for (const range of bindingRanges) {
    if (range.start > cursor) {
      nodes.push(...highlightCodeSegment(value.slice(cursor, range.start), format, cursor));
    }

    const isInvalid = normalizedInvalidRanges.some(invalidRange =>
      invalidRange.start === range.start && invalidRange.end === range.end,
    );

    nodes.push(
      <span
        key={`binding-${range.start}-${range.end}`}
        style={isInvalid ? bindingErrorTokenStyle : bindingTokenStyle}
      >
        {value.slice(range.start, range.end)}
      </span>,
    );
    cursor = range.end;
  }

  if (cursor < value.length) {
    nodes.push(...highlightCodeSegment(value.slice(cursor), format, cursor));
  }

  return nodes;
}

function highlightCodeSegment(
  value: string,
  format: CodeFormat,
  offset = 0,
): React.ReactNode[] {
  return format === 'json' ? highlightJson(value, offset) : highlightTypeScript(value, offset);
}

function highlightJson(value: string, offset = 0): React.ReactNode[] {
  return tokenizeCode(
    value,
    /("(?:\\.|[^"\\])*")(\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|[{}[\],:]/g,
    (match) => {
      if (match.startsWith('"')) {
        return match.endsWith(':') || /"\s*:$/.test(match)
          ? tokenStyle.jsonKey
          : tokenStyle.string;
      }

      if (/^(?:true|false|null)$/.test(match)) return tokenStyle.literal;
      if (/^-?\d/.test(match)) return tokenStyle.number;
      return tokenStyle.punctuation;
    },
    offset,
  );
}

function highlightTypeScript(value: string, offset = 0): React.ReactNode[] {
  return tokenizeCode(
    value,
    /\/\/.*|\/\*[\s\S]*?\*\/|`(?:\\.|[^`\\])*`|'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|\b(?:async|await|break|case|catch|class|const|continue|default|else|export|extends|false|finally|for|from|function|if|import|in|interface|let|null|return|throw|true|try|type|typeof|void|while)\b|\b[A-Z][A-Za-z0-9_]*\b|\b\d+(?:\.\d+)?\b|[{}[\]().,;:<>+=*/?-]/g,
    (match) => {
      if (match.startsWith('//') || match.startsWith('/*')) return tokenStyle.comment;
      if (/^[`'"]/.test(match)) return tokenStyle.string;
      if (/^\d/.test(match)) return tokenStyle.number;
      if (/^(?:true|false|null)$/.test(match)) return tokenStyle.literal;
      if (/^[A-Z]/.test(match)) return tokenStyle.type;
      if (/^[{}[\]().,;:<>+=*/?-]$/.test(match)) return tokenStyle.punctuation;
      return tokenStyle.keyword;
    },
    offset,
  );
}

function tokenizeCode(
  value: string,
  pattern: RegExp,
  styleFor: (match: string) => React.CSSProperties,
  offset = 0,
): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let cursor = 0;
  pattern.lastIndex = 0;

  let match = pattern.exec(value);
  while (match) {
    const token = match[0];
    const index = match.index;

    if (token.length === 0) {
      match = pattern.exec(value);
      continue;
    }

    if (index > cursor) nodes.push(value.slice(cursor, index));

    nodes.push(
      <span key={`${offset + index}-${token}`} style={styleFor(token)}>
        {token}
      </span>,
    );
    cursor = index + token.length;
    match = pattern.exec(value);
  }

  if (cursor < value.length) nodes.push(value.slice(cursor));
  return nodes;
}

function EmptyPanel() {
  return (
    <div style={emptyPanelStyle}>
      Selecciona un step
    </div>
  );
}

function parseJsonObject(value: string): {
  error?: string;
  ok: boolean;
  value: Record<string, unknown>;
} {
  try {
    const parsed = JSON.parse(value) as unknown;
    return {
      ok: true,
      value: isRecord(parsed) ? parsed : {},
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Invalid JSON',
      ok: false,
      value: {},
    };
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toStringRecord(value: Record<string, unknown>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      typeof item === 'string' ? item : JSON.stringify(item),
    ]),
  );
}

function extractMockHydrationReferences(value: string): string[] {
  const references = new Set<string>();

  for (const range of extractBindingRanges(value)) {
    const reference = value.slice(range.start, range.end);
    if (isCompleteBinding(reference)) references.add(reference);
  }

  return Array.from(references).sort();
}

function syncMockHydrationValues(
  currentValues: Record<string, string>,
  references: string[],
): Record<string, string> {
  return Object.fromEntries(
    references.map(reference => [
      reference,
      currentValues[reference] ?? MOCK_HYDRATION_DEFAULT_VALUE,
    ]),
  );
}

function hydrateMockBindings(
  value: unknown,
  mockValues: Record<string, string>,
): Record<string, unknown> {
  const hydratedValue = hydrateValue(value, mockValues);
  return isRecord(hydratedValue) ? hydratedValue : {};
}

function hydrateValue(value: unknown, mockValues: Record<string, string>): unknown {
  if (typeof value === 'string') return hydrateString(value, mockValues);
  if (Array.isArray(value)) {
    const items: unknown[] = value;
    return items.map(item => hydrateValue(item, mockValues));
  }

  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        hydrateValue(item, mockValues),
      ]),
    );
  }

  return value;
}

function hydrateString(value: string, mockValues: Record<string, string>): string {
  return Object.entries(mockValues).reduce(
    (nextValue, [reference, mockValue]) => nextValue.replaceAll(reference, mockValue),
    value,
  );
}

function isCompleteBinding(value: string): boolean {
  return /^\{\{[^{}\s]+(?:\.[^{}\s]+)*\}\}$/.test(value);
}

function resolveNextStepId({
  edges,
  inputValue,
  previewAction,
  selectedNodeId,
  stepData,
}: {
  edges: Edge[];
  inputValue: Record<string, unknown>;
  previewAction: PreviewAction;
  selectedNodeId: string;
  stepData: StepNodeData;
}): string | null {
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

  return matchedEdge?.target ?? defaultEdge?.target ?? null;
}

function evaluateConditionOutput({
  inputValue,
  output,
  previewAction,
  selectedNodeId,
}: {
  inputValue: Record<string, unknown>;
  output: NonNullable<StepNodeData['outputs']>[number];
  previewAction: PreviewAction;
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
  previewAction: PreviewAction;
  selectedNodeId: string;
}): unknown {
  const binding = parseStepResultBinding(field);
  if (!binding) return readPath(inputValue, [field]);

  if (binding.stepId === selectedNodeId) {
    return readPath(previewAction.value, binding.path);
  }

  return readPath(inputValue, binding.path);
}

function parseStepResultBinding(value: string): {
  path: string[];
  stepId: string;
} | null {
  const match = /^\{\{steps\.([^.{}]+)\.result(?:\.([^{}]+))?\}\}$/.exec(value);
  if (!match) return null;

  return {
    path: match[2]?.split('.').filter(Boolean) ?? [],
    stepId: match[1],
  };
}

function readPath(source: unknown, path: string[]): unknown {
  if (path.length === 0) return source;

  let currentValue = source;
  for (const segment of path) {
    if (!isRecord(currentValue)) return undefined;
    currentValue = currentValue[segment];
  }

  return currentValue;
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

function buildPreviousStepImports(
  nodes: Node[],
  edges: Edge[],
  selectedNodeId: string,
): StepImportOption[] {
  const nodesById = new Map<string, Node>();
  for (const node of nodes) {
    nodesById.set(node.id, node);
  }
  const previousIds = new Set<string>();
  const pendingIds: string[] = edges
    .filter(edge => edge.target === selectedNodeId)
    .map((edge): string => edge.source);

  while (pendingIds.length > 0) {
    const candidateId = pendingIds.shift();
    if (!candidateId || previousIds.has(candidateId) || candidateId === selectedNodeId) continue;

    previousIds.add(candidateId);
    for (const edge of edges) {
      if (edge.target === candidateId) pendingIds.push(edge.source);
    }
  }

  return Array.from(previousIds)
    .map((stepId) => {
      const stepIdString = stepId;
      const node = nodesById.get(stepIdString);
      const nodeData = node?.data as unknown as Partial<StepNodeData> | undefined;
      if (!nodeData?.execution) return null;

      return {
        fields: nodeData.fields ?? [],
        id: stepIdString,
        name: nodeData.stepName ?? nodeData.label ?? nodeData.execution.type,
      };
    })
    .filter((step): step is StepImportOption => step !== null)
    .sort((left, right) => left.name.localeCompare(right.name));
}

function nextAvailableKey(source: Record<string, unknown>, preferredKey: string): string {
  if (!Object.hasOwn(source, preferredKey)) return preferredKey;

  let index = 2;
  let candidate = `${preferredKey}${index}`;
  while (Object.hasOwn(source, candidate)) {
    index += 1;
    candidate = `${preferredKey}${index}`;
  }

  return candidate;
}

function toInputKey(value: string): string {
  const words = value
    .replaceAll(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return 'value';

  return words
    .map((word, index) => {
      const normalized = word.charAt(0).toUpperCase() + word.slice(1);
      return index === 0
        ? normalized.charAt(0).toLowerCase() + normalized.slice(1)
        : normalized;
    })
    .join('');
}

function positionFromMouseEvent(
  event: React.MouseEvent<HTMLElement>,
): ImportBrowserPosition {
  return clampImportBrowserPosition({
    left: event.clientX + 8,
    top: event.clientY + 10,
  });
}

function positionFromTextareaCaret(element: HTMLTextAreaElement): ImportBrowserPosition {
  const rectangle = element.getBoundingClientRect();
  const computedStyle = window.getComputedStyle(element);
  const mirror = document.createElement('div');
  const marker = document.createElement('span');
  const mirroredProperties = [
    'border-bottom-width',
    'border-left-width',
    'border-right-width',
    'border-top-width',
    'box-sizing',
    'font-family',
    'font-size',
    'font-style',
    'font-weight',
    'height',
    'letter-spacing',
    'line-height',
    'padding-bottom',
    'padding-left',
    'padding-right',
    'padding-top',
    'tab-size',
    'text-indent',
    'text-transform',
    'width',
  ];

  mirroredProperties.forEach((property) => {
    mirror.style.setProperty(property, computedStyle.getPropertyValue(property));
  });

  mirror.style.left = `${rectangle.left - element.scrollLeft}px`;
  mirror.style.overflow = 'visible';
  mirror.style.pointerEvents = 'none';
  mirror.style.position = 'fixed';
  mirror.style.top = `${rectangle.top - element.scrollTop}px`;
  mirror.style.visibility = 'hidden';
  mirror.style.whiteSpace = 'pre';
  mirror.style.zIndex = '-1';

  mirror.append(document.createTextNode(element.value.slice(0, element.selectionEnd)));
  marker.textContent = '.';
  mirror.append(marker);
  document.body.append(mirror);

  const markerRectangle = marker.getBoundingClientRect();
  mirror.remove();

  return clampImportBrowserPosition({
    left: markerRectangle.left + 14,
    top: markerRectangle.bottom + 18,
  });
}

function clampImportBrowserPosition(position: ImportBrowserPosition): ImportBrowserPosition {
  if (typeof window === 'undefined') return position;

  const margin = 8;
  const estimatedMenuWidth = 320;
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

function validateBindings(value: string, previousSteps: StepImportOption[]): {
  invalidRanges: EditorSelectionRange[];
  message: string | null;
} {
  const invalidRanges = extractBindingRanges(value)
    .filter(range => !isValidBinding(value.slice(range.start, range.end), previousSteps));

  return {
    invalidRanges,
    message: invalidRanges.length > 0 ? 'Binding incompleto o inválido' : null,
  };
}

function extractBindingRanges(value: string): EditorSelectionRange[] {
  const ranges: EditorSelectionRange[] = [];
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

function findIncompleteBindingEnd(value: string, start: number): number {
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

function isValidBinding(value: string, previousSteps: StepImportOption[]): boolean {
  if (!/^\{\{[^{}\s]+(?:\.[^{}\s]+)*\}\}$/.test(value)) return false;

  const path = value.slice(2, -2);
  if (path === 'env.allowedOrigins' || path === 'env.secret') return true;

  const parts = path.split('.');
  if (parts.length < 3 || parts[0] !== 'steps' || parts[2] !== 'result') return false;

  const step = previousSteps.find(item => item.id === parts[1]);
  if (!step) return false;
  if (parts.length === 3) return true;

  const field = parts.slice(3).join('.');
  return field.length > 0 && step.fields.includes(field);
}

function normalizeRanges(
  ranges: EditorSelectionRange[],
  length: number,
): EditorSelectionRange[] {
  const normalized: EditorSelectionRange[] = [];
  const sortedRanges = [...ranges]
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

function findBindingRange(
  value: string,
  selection: EditorSelectionRange,
): EditorSelectionRange | null {
  if (selection.start !== selection.end) {
    const selectedText = value.slice(selection.start, selection.end);
    if (/^\{\{[^{}]*\}\}$/.test(selectedText)) {
      return selection;
    }
  }

  const cursor = selection.end;
  const openIndex = value.lastIndexOf('{{', cursor);
  if (openIndex < 0) return null;

  const closeIndex = value.indexOf('}}', openIndex + 2);
  if (closeIndex < 0) return null;

  const end = closeIndex + 2;
  if (cursor < openIndex || cursor > end) return null;

  const innerValue = value.slice(openIndex + 2, closeIndex);
  if (innerValue.includes('{{') || innerValue.includes('\n')) return null;

  return {
    end,
    start: openIndex,
  };
}

function parseBindingPath(value: string): {
  pane: ImportBrowserPane;
  stepId: string | null;
} {
  const path = value.replace(/^\{\{/, '').replace(/\}\}$/, '').trim();

  if (path.startsWith('steps.')) {
    return {
      pane: 'steps',
      stepId: path.split('.')[1] ?? null,
    };
  }

  if (path.startsWith('env.')) {
    return {
      pane: 'envs',
      stepId: null,
    };
  }

  return {
    pane: 'root',
    stepId: null,
  };
}

function createPreviewCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 640;
  canvas.height = 420;

  if (context) {
    context.fillStyle = colors.gray900;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = colors.cyan500;
    context.fillRect(80, 80, 180, 120);
    context.fillStyle = colors.blue500;
    context.fillRect(320, 160, 220, 140);
  }

  return canvas;
}

function createPreviewStream(): MediaStream {
  return new MediaStream();
}

function formatStepCodeSource(source: string): string {
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

async function executePreviewCode({
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

  // eslint-disable-next-line @typescript-eslint/no-implied-eval -- Builder preview.
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
  ) as (ctx: unknown, helpers: PreviewCodeHelpers) => unknown;

  return factory(previewContext, createPreviewCodeHelpers(previewContext));
}

function createPreviewCodeHelpers(state: Record<string, unknown>): PreviewCodeHelpers {
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

interface PreviewCodeHelpers {
  fetchJson: (url: string, init?: RequestInit) => Promise<unknown>;
  get: (path: string, fallback?: unknown) => unknown;
  map: (
    source: unknown,
    mappings: { input: string; output: string }[] | string,
  ) => Record<string, unknown>;
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

function normalizePreviewCodeResult(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) {
    return {
      data: {},
      status: value == null ? 'success' : String(value),
    };
  }

  if ('result' in value) return normalizePreviewCodeResult(value.result);

  const status = typeof value.status === 'string' ? value.status : 'success';
  const data = isRecord(value.data) ? value.data : previewDataFromRecord(value);
  return { status, data };
}

function previewDataFromRecord(value: Record<string, unknown>): Record<string, unknown> {
  if ('data' in value && !isRecord(value.data)) return { value: value.data };

  const data = { ...value };
  delete data.status;
  return data;
}

function formatPreviewCodeError(error: unknown): string {
  if (error instanceof Error) return error.stack ?? error.message;
  if (typeof error === 'string') return error;

  try {
    return JSON.stringify(error, null, 2);
  } catch {
    return 'Unknown preview code error';
  }
}

function formatJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

const panelStyle: React.CSSProperties = {
  background: colors.white,
  boxShadow: '8px 0 24px rgba(15, 23, 42, 0.08)',
  height: '100%',
  minHeight: 0,
  minWidth: 0,
  overflow: 'hidden',
  width: '100%',
};

const sectionHeaderStyle: React.CSSProperties = {
  background: colors.gray50,
  borderBottom: `1px solid ${colors.gray200}`,
  flexShrink: 0,
  minHeight: '2.125rem',
  padding: '0.25rem 0.625rem',
};

const sectionTitleStyle: React.CSSProperties = {
  color: colors.gray700,
  fontSize: typography.sizes.xs,
  fontWeight: typography.weights.bold,
  textTransform: 'uppercase',
};

const jsonInvalidBadgeStyle: React.CSSProperties = {
  background: colors.red50,
  border: `1px solid ${colors.red200}`,
  borderRadius: '0.25rem',
  color: colors.red700,
  fontSize: typography.sizes.xs,
  fontWeight: typography.weights.bold,
  padding: '0.125rem 0.375rem',
  whiteSpace: 'nowrap',
};

const sectionBodyStyle: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  overflow: 'visible',
};

const sectionHeaderActionsStyle: React.CSSProperties = {
  flexShrink: 0,
};

const inputPanelBodyStyle: React.CSSProperties = {
  height: '100%',
  minHeight: 0,
  position: 'relative',
};

const bindingErrorStyle: React.CSSProperties = {
  background: colors.red50,
  border: `1px solid ${colors.red200}`,
  borderRadius: '0.25rem',
  bottom: '0.5rem',
  color: colors.red700,
  fontSize: typography.sizes.xs,
  fontWeight: typography.weights.bold,
  left: '3rem',
  padding: '0.25rem 0.375rem',
  position: 'absolute',
  zIndex: 4,
};

const infoButtonStyle: React.CSSProperties = {
  alignItems: 'center',
  background: colors.gray100,
  border: `1px solid ${colors.gray300}`,
  borderRadius: '999px',
  color: colors.gray700,
  cursor: 'pointer',
  display: 'inline-flex',
  fontSize: typography.sizes.xs,
  fontWeight: typography.weights.bold,
  height: '1.25rem',
  justifyContent: 'center',
  padding: 0,
  width: '1.25rem',
};

const evaluateConditionButtonStyle: React.CSSProperties = {
  height: '1.5rem',
  padding: '0 0.5rem',
  whiteSpace: 'nowrap',
};

const evaluateConditionDisabledButtonStyle: React.CSSProperties = {
  background: 'transparent',
  borderColor: colors.gray200,
  color: colors.gray400,
  opacity: 0.55,
};

const mockHydrationButtonStyle: React.CSSProperties = {
  height: '1.5rem',
  padding: '0 0.5rem',
  whiteSpace: 'nowrap',
};

const mockHydrationDisabledButtonStyle: React.CSSProperties = {
  background: 'transparent',
  borderColor: colors.gray200,
  color: colors.gray400,
  opacity: 0.55,
};

const mockHydrationMenuStyle: React.CSSProperties = {
  background: colors.white,
  border: `1px solid ${colors.gray300}`,
  borderRadius: '0.375rem',
  boxShadow: '0 14px 32px rgba(15, 23, 42, 0.18)',
  maxHeight: '20rem',
  minWidth: '18rem',
  overflow: 'auto',
  padding: '0.5rem',
  position: 'absolute',
  width: 'max-content',
  zIndex: 1,
};

const mockHydrationReferenceStyle: React.CSSProperties = {
  color: colors.blue700,
  fontFamily: 'Menlo, Monaco, Consolas, monospace',
  fontSize: typography.sizes.xs,
  fontWeight: typography.weights.bold,
  whiteSpace: 'nowrap',
};

const mockHydrationInputStyle: React.CSSProperties = {
  background: colors.gray50,
  border: `1px solid ${colors.gray300}`,
  borderRadius: '0.25rem',
  boxSizing: 'border-box',
  color: colors.gray800,
  fontSize: typography.sizes.sm,
  minWidth: '18rem',
  padding: '0.375rem 0.5rem',
  width: '100%',
};

const importBrowserStyle: React.CSSProperties = {
  background: colors.white,
  border: `1px solid ${colors.gray300}`,
  borderRadius: '0.375rem',
  boxShadow: '0 14px 32px rgba(15, 23, 42, 0.18)',
  display: 'flex',
  flexDirection: 'column',
  maxHeight: 'calc(100% - 0.5rem)',
  overflow: 'hidden',
  position: 'absolute',
  width: 'max-content',
  zIndex: 1,
};

const importBrowserOverlayStyle: React.CSSProperties = {
  background: 'transparent',
  inset: 0,
  position: 'fixed',
  zIndex: 80,
};

const importBrowserColumnsStyle: React.CSSProperties = {
  display: 'flex',
  flex: 1,
  minHeight: 0,
  maxWidth: '100%',
  overflowX: 'visible',
  overflowY: 'hidden',
};

const importBrowserColumnStyle: React.CSSProperties = {
  borderRight: `1px solid ${colors.gray200}`,
  flex: '0 0 auto',
  maxWidth: '16rem',
  minWidth: '5.75rem',
  minHeight: 0,
  overflowX: 'hidden',
  overflowY: 'auto',
  padding: '0.25rem',
  width: 'max-content',
};

const importBrowserRowButtonStyle: React.CSSProperties = {
  alignItems: 'center',
  background: 'transparent',
  border: 'none',
  borderRadius: '0.25rem',
  color: colors.gray800,
  cursor: 'pointer',
  display: 'flex',
  fontSize: typography.sizes.sm,
  fontWeight: typography.weights.bold,
  gap: '0.625rem',
  justifyContent: 'space-between',
  minHeight: '1.625rem',
  padding: '0.25rem 0.375rem',
  textAlign: 'left',
  whiteSpace: 'nowrap',
  width: '100%',
};

const importBrowserSelectedRowStyle: React.CSSProperties = {
  background: colors.blue50,
  boxShadow: `inset 0 0 0 1px ${colors.blue200}`,
  color: colors.blue800,
};

const importBrowserCopiedRowStyle: React.CSSProperties = {
  background: colors.green50,
  boxShadow: `inset 0 0 0 1px ${colors.green300}`,
  color: colors.green800,
};

const importBrowserDisabledRowStyle: React.CSSProperties = {
  color: colors.gray400,
  cursor: 'default',
  opacity: 0.68,
};

const importChevronStyle: React.CSSProperties = {
  color: colors.gray400,
  flexShrink: 0,
  fontSize: typography.sizes.base,
  lineHeight: 1,
};

const stepImportButtonStyle: React.CSSProperties = {
  ...importBrowserRowButtonStyle,
  alignItems: 'center',
  color: colors.gray800,
  display: 'grid',
  columnGap: '0.625rem',
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  minWidth: '12rem',
  rowGap: '0.125rem',
};

const stepImportNameStyle: React.CSSProperties = {
  fontSize: typography.sizes.sm,
  fontWeight: typography.weights.bold,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const stepImportIdStyle: React.CSSProperties = {
  color: colors.gray500,
  fontFamily: 'Menlo, Monaco, Consolas, monospace',
  fontSize: typography.sizes.xs,
  gridColumn: '1 / -1',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const importValueButtonStyle: React.CSSProperties = {
  alignItems: 'center',
  background: colors.gray50,
  border: `1px solid ${colors.gray200}`,
  borderRadius: '0.25rem',
  boxSizing: 'border-box',
  color: colors.gray800,
  display: 'flex',
  flexShrink: 0,
  gap: '0.25rem',
  justifyContent: 'space-between',
  minHeight: '1.625rem',
  minWidth: '7.5rem',
  padding: '0.1875rem 0.1875rem 0.1875rem 0.375rem',
  textAlign: 'left',
  width: '100%',
};

const importValueLabelStyle: React.CSSProperties = {
  fontSize: typography.sizes.sm,
  fontWeight: typography.weights.bold,
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const importValueActionsStyle: React.CSSProperties = {
  display: 'inline-flex',
  flexShrink: 0,
  justifyContent: 'flex-end',
  minWidth: '2.625rem',
  overflow: 'visible',
};

const importValueActionStyle: React.CSSProperties = {
  alignItems: 'center',
  background: 'transparent',
  border: 'none',
  color: colors.gray700,
  cursor: 'pointer',
  display: 'inline-flex',
  flexShrink: 0,
  fontSize: typography.sizes.xs,
  fontWeight: typography.weights.bold,
  height: '1rem',
  justifyContent: 'center',
  lineHeight: 1,
  padding: 0,
  width: '2rem',
};

const importEmptyStyle: React.CSSProperties = {
  color: colors.gray500,
  fontSize: typography.sizes.sm,
  padding: '0.75rem',
  textAlign: 'center',
};

const codePanelStyle: React.CSSProperties = {
  background: colors.editorBg,
  height: '100%',
  minHeight: 0,
  overflow: 'hidden',
  position: 'relative',
};

const codePreviewPanelStyle: React.CSSProperties = {
  height: '100%',
  minHeight: 0,
  position: 'relative',
};

const codePreviewPlayButtonStyle: React.CSSProperties = {
  bottom: '0.75rem',
  boxShadow: '0 10px 24px rgba(15, 23, 42, 0.24)',
  minWidth: '4.5rem',
  position: 'absolute',
  right: '0.75rem',
  zIndex: 5,
};

const codePreviewErrorBannerStyle: React.CSSProperties = {
  alignItems: 'flex-start',
  background: colors.red50,
  border: `1px solid ${colors.red300}`,
  borderRadius: '0.375rem',
  bottom: '0.75rem',
  boxShadow: '0 12px 28px rgba(127, 29, 29, 0.18)',
  color: colors.red800,
  display: 'grid',
  gap: '0.5rem',
  gridTemplateColumns: 'auto minmax(0, 1fr)',
  left: '0.75rem',
  maxHeight: '52%',
  overflow: 'auto',
  padding: '0.625rem',
  position: 'absolute',
  right: '5.75rem',
  zIndex: 5,
};

const codePreviewErrorCloseStyle: React.CSSProperties = {
  alignItems: 'center',
  background: colors.red100,
  border: `1px solid ${colors.red300}`,
  borderRadius: '999px',
  color: colors.red700,
  cursor: 'pointer',
  display: 'inline-flex',
  fontSize: typography.sizes.xs,
  fontWeight: typography.weights.bold,
  height: '1.25rem',
  justifyContent: 'center',
  lineHeight: 1,
  padding: 0,
  width: '1.25rem',
};

const codePreviewErrorTextStyle: React.CSSProperties = {
  color: colors.red800,
  fontFamily: 'Menlo, Monaco, Consolas, monospace',
  fontSize: typography.sizes.xs,
  lineHeight: 1.45,
  margin: 0,
  whiteSpace: 'pre-wrap',
};

const formatBadgeStyle: React.CSSProperties = {
  background: colors.gray100,
  border: `1px solid ${colors.gray200}`,
  borderRadius: '0.25rem',
  color: colors.gray600,
  fontSize: typography.sizes.xs,
  fontWeight: typography.weights.bold,
  padding: '0.125rem 0.375rem',
};

const editorPresentationStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '2.25rem minmax(0, 1fr)',
  inset: 0,
  overflow: 'hidden',
  pointerEvents: 'none',
  position: 'absolute',
};

const editorTextareaStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  boxSizing: 'border-box',
  caretColor: colors.editorCaret,
  color: 'transparent',
  fontFamily: 'Menlo, Monaco, Consolas, monospace',
  fontSize: typography.sizes.sm,
  height: '100%',
  lineHeight: 1.45,
  margin: 0,
  outline: 'none',
  overflow: 'auto',
  padding: '0.75rem',
  paddingLeft: '3rem',
  resize: 'none',
  tabSize: 2,
  whiteSpace: 'pre',
  width: '100%',
};

const readOnlyEditorStyle: React.CSSProperties = {
  ...codePanelStyle,
  display: 'grid',
  gridTemplateColumns: '2.25rem minmax(0, 1fr)',
  overflow: 'auto',
};

const lineNumberColumnStyle: React.CSSProperties = {
  background: colors.editorGutterBg,
  borderRight: `1px solid ${colors.editorGutterBorder}`,
  color: colors.editorMuted,
  fontFamily: 'Menlo, Monaco, Consolas, monospace',
  fontSize: typography.sizes.sm,
  lineHeight: 1.45,
  paddingTop: '0.75rem',
  textAlign: 'right',
  userSelect: 'none',
};

const readOnlyLineNumberColumnStyle: React.CSSProperties = {
  ...lineNumberColumnStyle,
  position: 'sticky',
  left: 0,
  zIndex: 1,
};

const lineNumberStyle: React.CSSProperties = {
  height: `calc(${typography.sizes.sm} * 1.45)`,
  paddingRight: '0.5rem',
};

const highlightSurfaceStyle: React.CSSProperties = {
  color: colors.editorText,
  fontFamily: 'Menlo, Monaco, Consolas, monospace',
  fontSize: typography.sizes.sm,
  lineHeight: 1.45,
  margin: 0,
  padding: '0.75rem',
  tabSize: 2,
  whiteSpace: 'pre',
};

const tokenStyle = {
  comment: { color: colors.editorMuted, fontStyle: 'italic' },
  jsonKey: { color: colors.editorJsonKey },
  keyword: { color: colors.editorKeyword },
  literal: { color: colors.editorLiteral },
  number: { color: colors.editorNumber },
  punctuation: { color: colors.editorPunctuation },
  string: { color: colors.editorString },
  type: { color: colors.editorType },
} satisfies Record<string, React.CSSProperties>;

const bindingTokenStyle: React.CSSProperties = {
  background: 'color-mix(in srgb, var(--color-blue500) 18%, transparent)',
  borderRadius: '0.1875rem',
  boxShadow: `inset 0 0 0 1px ${colors.blue300}`,
  color: colors.blue700,
  fontWeight: typography.weights.bold,
};

const bindingErrorTokenStyle: React.CSSProperties = {
  background: 'color-mix(in srgb, var(--color-red500) 18%, transparent)',
  borderBottom: `1px solid ${colors.red500}`,
  color: colors.red400,
  fontWeight: typography.weights.bold,
};

const previewViewportStyle: React.CSSProperties = {
  background: 'var(--surface-canvas, color-mix(in srgb, var(--color-pink500) 16%, var(--color-gray50)))',
  height: '100%',
  overflow: 'hidden',
  position: 'relative',
};

const previewSurfaceStyle: React.CSSProperties = {
  height: '560px',
  left: '50%',
  position: 'absolute',
  top: '50%',
  transform: 'translate(-50%, -50%) scale(0.64)',
  transformOrigin: 'center',
  width: '820px',
};

const emptyPreviewStyle: React.CSSProperties = {
  alignItems: 'center',
  color: colors.gray500,
  display: 'flex',
  height: '100%',
  justifyContent: 'center',
  padding: '1rem',
  textAlign: 'center',
};

const emptyPanelStyle: React.CSSProperties = {
  alignItems: 'center',
  color: colors.gray500,
  display: 'flex',
  fontSize: typography.sizes.md,
  height: '100%',
  justifyContent: 'center',
  padding: '1rem',
  textAlign: 'center',
};
