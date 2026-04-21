import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { generateId } from '@/lib/uuid';
import { colors } from '@/styles/tokens';

export const StartNode = () => {
  return (
    <div style={{
      background: colors.green600,
      color: colors.white,
      padding: '10px',
      borderRadius: '50%',
      width: '30px',
      height: '30px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: `3px solid ${colors.green500}`,
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      fontWeight: 'bold',
      fontSize: '12px'
    }}>
      Start
      <Handle
        type="source"
        position={Position.Right}
        id="start"
        style={{ background: colors.green500, width: '10px', height: '10px', right: '-5px', border: 'none' }}
      />
    </div>
  );
};
