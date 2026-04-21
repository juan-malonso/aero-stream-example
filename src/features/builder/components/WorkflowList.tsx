import React, { useState } from 'react';
import { useWorkflowMetadata } from '@/hooks/useWorkflow';
import { workflowService } from '@/lib/workflow/workflow.service';
import { colors, radii, shadows, typography } from '@/styles/tokens';
import { sectionHeaderStyle } from '@/styles/theme';
import { Button, Input, Row, Column } from '@/components/ui';

export function WorkflowList() {
  const { workflows, selectWorkflow, deleteWorkflow, loadWorkflows } = useWorkflowMetadata();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newFlowName, setNewFlowName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFlowName.trim()) return;
    try {
      await workflowService.upsertWorkflow({
        name: newFlowName,
        version: 1,
        start: '',
        steps: {},
        globals: {},
      });
      await loadWorkflows();
      setNewFlowName('');
      setShowCreateForm(false);
    } catch (err) {
      console.error('Error creating workflow:', err);
    }
  };

  return (
    <Column style={{ borderTop: `1px solid ${colors.gray200}`, flex: 1, overflowY: 'auto', background: colors.white }} gap="0" align="stretch">
      <Row justify="space-between" align="center" style={{ 
        padding: '1rem 1.25rem', 
        borderBottom: `1px solid ${colors.gray200}`, 
        background: colors.gray50,
      }}>
        <div style={sectionHeaderStyle}>Saved Workflows</div>
        <Button 
          onClick={() => setShowCreateForm(!showCreateForm)}
          variant={showCreateForm ? 'danger' : 'primary'}
          size="sm"
          style={{ borderRadius: radii.full, fontSize: typography.sizes.sm }}
        >
          {showCreateForm ? 'Cancel' : '+ New'}
        </Button>
      </Row>

      {showCreateForm && (
        <form onSubmit={handleCreate}>
          <Row gap="0.5rem" style={{ padding: '0.5rem', background: colors.gray50, borderBottom: `1px solid ${colors.gray200}` }} align="center">
            <Input 
              type="text" 
              placeholder="Flow name..." 
              value={newFlowName}
              onChange={(e) => setNewFlowName(e.target.value)}
              style={{ flex: 1, padding: '0.5rem', fontSize: typography.sizes.base }}
              autoFocus
            />
            <Button type="submit" style={{ fontSize: typography.sizes.base, background: colors.emerald500, color: 'white' }} size="md" >
              Save
            </Button>
          </Row>
        </form>
      )}

      <Column gap="0.75rem" align="stretch" style={{ padding: '1rem 1.25rem' }}>
        {workflows.map(wf => {
          const isConfirming = confirmDeleteId === wf.id;

          return (
            <Row key={wf.id} justify="space-between" align="center" style={{ padding: '0.5rem 1rem', background: colors.white, border: `1px solid ${colors.gray200}`, borderRadius: radii.xl, boxShadow: shadows.sm, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: isConfirming ? colors.red500 : colors.primary500, transition: 'background-color 0.2s' }} />
              
              <div style={{ fontSize: typography.sizes.base, fontWeight: 600, color: colors.gray900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, letterSpacing: '-0.01em', paddingLeft: '4px', opacity: isConfirming ? 0.6 : 1, transition: 'opacity 0.2s' }}>
                {wf.name}
              </div>

              <Row gap="0.375rem" style={{ paddingLeft: '0.5rem' }}>
                {!isConfirming ? (
                  <Button 
                    onClick={() => selectWorkflow(wf.id!)}
                    variant="ghost"
                    style={{ padding: '0.375rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="Edit Flow"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                  </Button>
                ) : (
                  <Button 
                    onClick={() => setConfirmDeleteId(null)}
                    variant="ghost"
                    style={{ padding: '0.375rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="Cancel Delete"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </Button>
                )}
                
                <Button 
                  onClick={() => {
                    if (isConfirming) {
                      deleteWorkflow(wf.id!);
                      setConfirmDeleteId(null);
                    } else {
                      setConfirmDeleteId(wf.id!);
                    }
                  }}
                  style={{ padding: '0.375rem', background: isConfirming ? colors.red500 : colors.red50, color: isConfirming ? colors.white : colors.red600, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title={isConfirming ? "Confirm Delete" : "Delete Workflow"}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </Button>
              </Row>
            </Row>
          );
        })}
        {workflows.length === 0 && !showCreateForm && (
          <div style={{ fontSize: typography.sizes.base, color: colors.gray400, textAlign: 'center', marginTop: '1rem', fontStyle: 'italic' }}>
            No saved workflows yet.
          </div>
        )}
      </Column>
    </Column>
  );
}
