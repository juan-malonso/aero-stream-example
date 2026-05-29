import { useReactFlow } from '@xyflow/react';

import { colors } from '../../../styles/tokens.ts';
import { StepNode } from '../../builder/StepNode';
import type { StepNodeData } from '../../builder/types';
import type { BuilderStepDefinition } from '../../types.ts';

const defaultSource = [
  'async function run(ctx, helpers) {',
  "  const data = await helpers.fetchJson('http://localhost:3000/api/sessions/request');",
  '  return {',
  '    result: data,',
  '  };',
  '}',
].join('\n');

export const codeBuilderStep: BuilderStepDefinition = {
  id: 'code',
  label: 'Code',
  toolboxLabel: 'Code Backend',
  nodeType: 'codeStep',
  executionType: 'code',
  executionMode: 'SERVER',
  fields: ['result'],
  propKeys: [],
  accentColor: colors.teal600,
  defaultCode: {
    entrypoint: 'run',
    language: 'ts',
    source: defaultSource,
  },
};

export function CodeNode({ id, data }: { id: string; data: StepNodeData }) {
  const { updateNodeData } = useReactFlow();
  const code = data.code ?? codeBuilderStep.defaultCode!;

  return (
    <StepNode id={id} data={data} accentColor={codeBuilderStep.accentColor}>
      <textarea
        className="nodrag"
        spellCheck={false}
        value={code.source}
        onChange={(event) => {
          updateNodeData(id, {
            code: {
              entrypoint: code.entrypoint ?? 'run',
              language: 'ts',
              source: event.target.value,
            },
          });
        }}
        style={{
          background: colors.gray900,
          border: `1px solid ${colors.teal400}`,
          borderRadius: '0.375rem',
          color: colors.gray50,
          fontFamily: 'Menlo, Monaco, Consolas, monospace',
          fontSize: '11px',
          lineHeight: 1.5,
          minHeight: '180px',
          padding: '0.75rem',
          resize: 'vertical',
          width: '100%',
        }}
      />
    </StepNode>
  );
}
