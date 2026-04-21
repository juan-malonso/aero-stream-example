import { type TowerWorkflow, type WorkflowMetadata } from './workflow';

const API_BASE_URL = process.env.NEXT_PUBLIC_TOWER_API_URL || 'http://localhost:8787/api';

export const workflowService = {
  async getWorkflows(): Promise<WorkflowMetadata[]> {
    const res = await fetch(`${API_BASE_URL}/workflows`);
    if (!res.ok) throw new Error('Failed to fetch workflows');
    const { data } = await res.json();
    return data;
  },

  async getWorkflowById(id: string): Promise<TowerWorkflow> {
    const res = await fetch(`${API_BASE_URL}/workflows/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch workflow ${id}`);
    const { data } = await res.json();
    return data;
  },

  async upsertWorkflow(workflow: TowerWorkflow): Promise<TowerWorkflow> {
    const id = workflow.id || crypto.randomUUID();
    const res = await fetch(`${API_BASE_URL}/workflows/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workflow),
    });
    if (!res.ok) throw new Error('Failed to save workflow');
    const { data } = await res.json();
    return data;
  },

  async deleteWorkflow(id: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/workflows/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`Failed to delete workflow ${id}`);
  }
};