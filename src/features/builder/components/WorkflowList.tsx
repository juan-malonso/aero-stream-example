import React, { useEffect, useState } from 'react';
import { useWorkflowMetadata } from '@/hooks/useWorkflow';
import { colors, radii, shadows, typography } from '@/styles/tokens';
import { sectionHeaderStyle } from '@/styles/theme';
import { Button, Input, Row, Column } from '@/components/ui';

type EditorTarget = string | 'new' | null;

function WorkflowEditor({
  activeWorkflowName,
  setActiveWorkflowName,
  allowedOrigins,
  secret,
  setAllowedOrigins,
  setSecret,
  isSaving,
  onSave,
  isNew,
}: {
  activeWorkflowName: string;
  setActiveWorkflowName: (name: string) => void;
  allowedOrigins: string[];
  secret: string;
  setAllowedOrigins: (origins: string[]) => void;
  setSecret: (secret: string) => void;
  isSaving: boolean;
  onSave: () => Promise<void>;
  isNew: boolean;
}) {
  const origins = allowedOrigins.length > 0 ? allowedOrigins : [''];

  return (
    <Column gap="0.75rem" align="stretch" style={{ paddingTop: '0.75rem', borderTop: `1px solid ${colors.gray200}` }}>
      <Column gap="0.375rem" align="stretch">
        <div style={{ fontSize: typography.sizes.xs, fontWeight: typography.weights.bold, color: colors.gray500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Name
        </div>
        <Input
          type="text"
          value={activeWorkflowName}
          onChange={(event) => setActiveWorkflowName(event.target.value)}
          placeholder="Workflow name"
        />
      </Column>

      <Column gap="0.5rem" align="stretch">
        <Row justify="space-between" align="center">
          <div style={{ fontSize: typography.sizes.xs, fontWeight: typography.weights.bold, color: colors.gray500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Allowed Origins
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setAllowedOrigins([...allowedOrigins, ''])}
            style={{ padding: '0.25rem 0.5rem' }}
          >
            + Add origin
          </Button>
        </Row>

        <Column gap="0.5rem" align="stretch">
          {origins.map((origin, index) => (
            <Row key={index.toString()} gap="0.5rem" align="center">
              <Input
                type="text"
                value={origin}
                onChange={(event) => {
                  const nextOrigins = [...origins];
                  nextOrigins[index] = event.target.value;
                  setAllowedOrigins(nextOrigins);
                }}
                placeholder="http://localhost:3000"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setAllowedOrigins(origins.filter((_, itemIndex) => itemIndex !== index))}
                disabled={origins.length === 1 && !origin}
                style={{ color: colors.red600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="Remove origin"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </Button>
            </Row>
          ))}
        </Column>
      </Column>

      <Column gap="0.375rem" align="stretch">
        <div style={{ fontSize: typography.sizes.xs, fontWeight: typography.weights.bold, color: colors.gray500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Secret Token
        </div>
        <Input
          type="text"
          value={secret}
          onChange={(event) => setSecret(event.target.value)}
          placeholder="my-super-secret-token"
        />
      </Column>

      <Button
        type="button"
        onClick={() => {
          void onSave();
        }}
        disabled={isSaving || !activeWorkflowName.trim()}
        variant="primary"
        size="md"
        style={{ width: '100%' }}
      >
        {isSaving ? 'Saving...' : isNew ? 'Create Workflow' : 'Save Changes'}
      </Button>
    </Column>
  );
}

export function WorkflowList() {
  const {
    workflows,
    activeWorkflowId,
    activeWorkflowName,
    security,
    setSecurity,
    setActiveWorkflowName,
    selectWorkflow,
    saveWorkflow,
    deleteWorkflow,
    createNewWorkflow,
    isSaving,
  } = useWorkflowMetadata();
  const [editorTarget, setEditorTarget] = useState<EditorTarget>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (editorTarget === 'new' && activeWorkflowId) {
      setEditorTarget(activeWorkflowId);
    }
  }, [editorTarget, activeWorkflowId]);

  useEffect(() => {
    if (!activeWorkflowId || editorTarget === 'new' || editorTarget === activeWorkflowId) {
      return;
    }

    setEditorTarget(activeWorkflowId);
  }, [activeWorkflowId, editorTarget]);

  useEffect(() => {
    if (!editorTarget || editorTarget === 'new') {
      return;
    }

    if (!workflows.some((workflow) => workflow.id === editorTarget)) {
      setEditorTarget(null);
    }
  }, [editorTarget, workflows]);

  const setAllowedOrigins = (origins: string[]) => {
    setSecurity({
      ...security,
      allowedOrigins: origins,
    });
  };

  const setSecret = (secret: string) => {
    setSecurity({
      ...security,
      secret,
    });
  };

  const handleCreateClick = () => {
    setConfirmDeleteId(null);

    if (editorTarget === 'new') {
      setEditorTarget(null);
      return;
    }

    createNewWorkflow();
    setEditorTarget('new');
  };

  const handleSelectWorkflow = async (workflowId: string) => {
    setConfirmDeleteId(null);
    setEditorTarget(workflowId);
    await selectWorkflow(workflowId);
  };

  const renderEditor = (isNew: boolean) => (
    <WorkflowEditor
      activeWorkflowName={activeWorkflowName}
      setActiveWorkflowName={setActiveWorkflowName}
      allowedOrigins={security.allowedOrigins}
      secret={security.secret}
      setAllowedOrigins={setAllowedOrigins}
      setSecret={setSecret}
      isSaving={isSaving}
      onSave={saveWorkflow}
      isNew={isNew}
    />
  );

  return (
    <Column style={{ borderTop: `1px solid ${colors.gray200}`, flex: 1, background: colors.white }} gap="0" align="stretch">
      <Row
        justify="space-between"
        align="center"
        style={{
          padding: '1rem 1.25rem',
          borderBottom: `1px solid ${colors.gray200}`,
          background: colors.gray50,
        }}
      >
        <div style={sectionHeaderStyle}>Saved Workflows</div>
        <Button
          onClick={handleCreateClick}
          variant={editorTarget === 'new' ? 'danger' : 'primary'}
          size="sm"
          style={{ borderRadius: radii.full, fontSize: typography.sizes.sm }}
        >
          {editorTarget === 'new' ? 'Cancel' : '+ New'}
        </Button>
      </Row>

      <Column gap="0.75rem" align="stretch" style={{ padding: '0.75rem' }}>
        {editorTarget === 'new' && (
          <Column
            gap="0.75rem"
            align="stretch"
            style={{
              padding: '1rem',
              background: colors.white,
              border: `1px solid ${colors.blue200}`,
              borderRadius: radii.xl,
              boxShadow: shadows.sm,
            }}
          >
            <Row justify="space-between" align="center">
              <div style={{ fontSize: typography.sizes.base, fontWeight: 700, color: colors.gray900 }}>
                New workflow
              </div>
              <div style={{ fontSize: typography.sizes.xs, color: colors.blue600, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Draft
              </div>
            </Row>
            {renderEditor(true)}
          </Column>
        )}

        {workflows.map((workflow) => {
          const isConfirming = confirmDeleteId === workflow.id;
          const isEditing = editorTarget === workflow.id;
          const isActiveWorkflow = activeWorkflowId === workflow.id;

          return (
            <Column
              key={workflow.id}
              gap="0.75rem"
              align="stretch"
              style={{
                padding: '0.75rem 1rem',
                background: colors.white,
                border: `1px solid ${isEditing ? colors.blue200 : colors.gray200}`,
                borderRadius: radii.xl,
                boxShadow: shadows.sm,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '4px',
                  height: '100%',
                  background: isConfirming ? colors.red500 : isEditing ? colors.blue500 : colors.primary500,
                  transition: 'background-color 0.2s',
                }}
              />

              <Row justify="space-between" align="center">
                <div
                  style={{
                    fontSize: typography.sizes.base,
                    fontWeight: 600,
                    color: colors.gray900,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    flex: 1,
                    letterSpacing: '-0.01em',
                    paddingLeft: '4px',
                    opacity: isConfirming ? 0.6 : 1,
                    transition: 'opacity 0.2s',
                  }}
                >
                  {workflow.name}
                </div>

                <Row gap="0.375rem" style={{ paddingLeft: '0.5rem' }}>
                  <Button
                    onClick={() => {
                      void handleSelectWorkflow(workflow.id!);
                    }}
                    variant="ghost"
                    isActive={isEditing}
                    disabled={isEditing}
                    style={{ padding: '0.375rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title={isEditing ? 'Workflow already being edited' : 'Edit Flow'}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                  </Button>

                  {isConfirming ? (
                    <Button
                      onClick={() => setConfirmDeleteId(null)}
                      variant="ghost"
                      style={{ padding: '0.375rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      title="Cancel Delete"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </Button>
                  ) : null}

                  <Button
                    onClick={() => {
                      if (isConfirming) {
                        void deleteWorkflow(workflow.id!);
                        if (editorTarget === workflow.id) {
                          setEditorTarget(null);
                        }
                        setConfirmDeleteId(null);
                        return;
                      }

                      setConfirmDeleteId(workflow.id!);
                    }}
                    style={{ padding: '0.375rem', background: isConfirming ? colors.red500 : colors.red50, color: isConfirming ? colors.white : colors.red600, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title={isConfirming ? 'Confirm Delete' : 'Delete Workflow'}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                  </Button>
                </Row>
              </Row>

              {isEditing && isActiveWorkflow ? renderEditor(false) : null}
            </Column>
          );
        })}

        {workflows.length === 0 && editorTarget !== 'new' && (
          <div style={{ fontSize: typography.sizes.base, color: colors.gray400, textAlign: 'center', marginTop: '1rem', fontStyle: 'italic' }}>
            No saved workflows yet.
          </div>
        )}
      </Column>
    </Column>
  );
}
