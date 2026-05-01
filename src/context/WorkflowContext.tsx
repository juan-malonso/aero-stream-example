'use client';

import { type WorkflowConfig, type WorkflowMetadata } from '@/lib/workflow/workflow';
import { workflowService } from '@/lib/workflow/workflow.service';
import { parseReactFlowToTower, parseTowerToReactFlow } from '@/lib/workflow/workflowAdapter';

import React, { createContext, type ReactNode, useCallback, useEffect, useState, useContext } from 'react';
import { applyEdgeChanges, applyNodeChanges, type Edge, type Node, type OnEdgesChange, type OnNodesChange } from '@xyflow/react';

interface WorkflowMetadataContextProps {
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

interface WorkflowGraphContextProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
}

export const WorkflowMetadataContext = createContext<WorkflowMetadataContextProps | undefined>(undefined);
export const WorkflowGraphContext = createContext<WorkflowGraphContextProps | undefined>(undefined);

export const WorkflowProvider = ({ children }: { children: ReactNode }) => {
  const [workflows, setWorkflows] = useState<WorkflowMetadata[]>([]);
  const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null);
  const [activeWorkflowName, setActiveWorkflowName] = useState('New Workflow');
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [security, setSecurity] = useState<WorkflowConfig>({
    allowedOrigins: ['http://localhost:3000'],
    secret: 'my-super-secret-token',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => { setNodes((nds) => applyNodeChanges(changes, nds)); },
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
      setActiveWorkflowId(towerWorkflow.id || id);
      setActiveWorkflowName(towerWorkflow.name);
      setSecurity({
        allowedOrigins: towerWorkflow.config?.allowedOrigins ?? ['http://localhost:3000'],
        secret: towerWorkflow.config?.secret ?? 'my-super-secret-token',
      });
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
    setSecurity({ allowedOrigins: ['http://localhost:3000'], secret: 'my-super-secret-token' });
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
    loadWorkflows();
  }, [loadWorkflows]);

  useEffect(() => {
    if (!activeWorkflowId && workflows.length > 0) {
      void selectWorkflow(workflows[0].id);
    }
  }, [activeWorkflowId, selectWorkflow, workflows]);

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
