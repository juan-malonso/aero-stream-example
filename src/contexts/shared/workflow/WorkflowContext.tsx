'use client';

import { applyEdgeChanges, applyNodeChanges, type Edge, type Node, type OnEdgesChange, type OnNodesChange } from '@xyflow/react';
import React, { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react';

import { DEFAULT_WORKFLOW_CONFIG, normalizeWorkflowConfig, type WorkflowConfig, type WorkflowMetadata } from '@/lib/builder/workflow/workflow';
import { workflowService } from '@/lib/builder/workflow/workflow.service';
import {
  parseReactFlowToTower,
  parseTowerToReactFlow,
  resolveWorkflowNodeOverlaps,
} from '@/lib/builder/workflow/workflowAdapter';

interface WorkflowMetadataContextProperties {
  workflows: WorkflowMetadata[];
  activeWorkflowId: string | null;
  activeWorkflowName: string;
  security: WorkflowConfig;
  setSecurity: React.Dispatch<React.SetStateAction<WorkflowConfig>>;
  isLoading: boolean;
  isSaving: boolean;
  setActiveWorkflowName: (name: string) => void;
  loadWorkflows: () => Promise<void>;
  selectWorkflow: (id: string) => Promise<void>;
  saveWorkflow: () => Promise<void>;
  deleteWorkflow: (id: string) => Promise<void>;
  createNewWorkflow: () => void;
}

interface WorkflowGraphContextProperties {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
}

export const WorkflowMetadataContext = createContext<WorkflowMetadataContextProperties | undefined>(undefined);
export const WorkflowGraphContext = createContext<WorkflowGraphContextProperties | undefined>(undefined);

export const WorkflowProvider = ({ children }: { children: ReactNode }) => {
  const [workflows, setWorkflows] = useState<WorkflowMetadata[]>([]);
  const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null);
  const [activeWorkflowName, setActiveWorkflowName] = useState('New Workflow');
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [security, setSecurity] = useState(DEFAULT_WORKFLOW_CONFIG);
  const [isDraftWorkflow, setIsDraftWorkflow] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      setNodes((nds) => {
        const fixedIds = new Set(changes
          .filter(change => change.type === 'position')
          .map(change => change.id));

        return resolveWorkflowNodeOverlaps(applyNodeChanges(changes, nds), { fixedIds });
      });
    },
    []
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => { setEdges((eds) => applyEdgeChanges(changes, eds)); },
    []
  );

  const loadWorkflows = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await workflowService.getWorkflows();
      setWorkflows(data);
    } catch (error) {
      console.error('Error loading workflows:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectWorkflow = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      const towerWorkflow = await workflowService.getWorkflowById(id);
      const { nodes: newNodes, edges: newEdges } = parseTowerToReactFlow(towerWorkflow);
      setNodes(newNodes);
      setEdges(newEdges);
      setActiveWorkflowId(towerWorkflow.id ?? id);
      setActiveWorkflowName(towerWorkflow.name);
      setIsDraftWorkflow(false);
      setSecurity(normalizeWorkflowConfig(towerWorkflow.config));
    } catch (error) {
      console.error('Error selecting workflow:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveWorkflow = useCallback(async () => {
    try {
      setIsSaving(true);
      const payload = parseReactFlowToTower(nodes, edges, activeWorkflowName, security);
      if (activeWorkflowId) payload.id = activeWorkflowId;

      const saved = await workflowService.upsertWorkflow(payload);
      setActiveWorkflowId(saved.id ?? null);
      setIsDraftWorkflow(false);
      await loadWorkflows();
    } catch (error) {
      console.error('Error saving workflow:', error);
    } finally {
      setIsSaving(false);
    }
  }, [nodes, edges, activeWorkflowName, activeWorkflowId, security, loadWorkflows]);

  const createNewWorkflow = useCallback(() => {
    setActiveWorkflowId(null);
    setActiveWorkflowName('New Workflow');
    setIsDraftWorkflow(true);
    setSecurity(DEFAULT_WORKFLOW_CONFIG);
    setNodes([]);
    setEdges([]);
  }, []);

  const deleteWorkflow = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      await workflowService.deleteWorkflow(id);
      if (activeWorkflowId === id) createNewWorkflow();
      await loadWorkflows();
    } catch (error) {
      console.error('Error deleting workflow:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activeWorkflowId, loadWorkflows, createNewWorkflow]);

  useEffect(() => {
    void loadWorkflows();
  }, [loadWorkflows]);

  useEffect(() => {
    if (!activeWorkflowId && !isDraftWorkflow && workflows.length > 0) {
      void selectWorkflow(workflows[0].id);
    }
  }, [activeWorkflowId, isDraftWorkflow, selectWorkflow, workflows]);

  return (
    <WorkflowGraphContext.Provider value={{
      nodes, edges, onNodesChange, onEdgesChange, setNodes, setEdges
    }}>
      <WorkflowMetadataContext.Provider value={{
        workflows, activeWorkflowId, activeWorkflowName, security, setSecurity, isLoading, isSaving,
        setActiveWorkflowName, loadWorkflows, selectWorkflow, saveWorkflow, deleteWorkflow, createNewWorkflow
      }}>
        {children}
      </WorkflowMetadataContext.Provider>
    </WorkflowGraphContext.Provider>
  );
};

export const useWorkflowMetadata = () => {
  const context = useContext(WorkflowMetadataContext);
  if (!context) throw new Error('useWorkflowMetadata must be used within a WorkflowProvider');
  return context;
};

export const useWorkflowGraph = () => {
  const context = useContext(WorkflowGraphContext);
  if (!context) throw new Error('useWorkflowGraph must be used within a WorkflowProvider');
  return context;
};
