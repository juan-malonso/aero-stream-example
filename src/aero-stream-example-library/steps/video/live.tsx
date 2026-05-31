import { type AeroStreamComponent } from 'aero-stream-pilot';
import React, { useEffect, useRef } from 'react';

import { Button,Column } from '@/components/ui';
import { colors } from '@/styles/tokens';

import { StepCard } from '../../live/StepCard';
import type { LiveStepDefinition } from '../../types';

export const VideoComponent: AeroStreamComponent<React.ReactNode> = ({
  data,
  submit,
  reject,
  stream,
  canvas,
}) => {
  const videoReference = useRef<HTMLVideoElement>(null);
  const ghostContainerReference = useRef<HTMLDivElement>(null);

  const config = data as {
    title?: string;
    subtitle?: string;
  };

  useEffect(() => {
    if (videoReference.current) {
      videoReference.current.srcObject = stream();
    }

    const container = ghostContainerReference.current;
    const canvasElement: HTMLCanvasElement = canvas();

    if (container) {
      canvasElement.style.position = 'absolute';
      canvasElement.style.top = '0';
      canvasElement.style.left = '0';
      canvasElement.style.width = '100%';
      canvasElement.style.height = '100%';
      canvasElement.style.objectFit = 'cover';

      container.appendChild(canvasElement);

      return () => {
        if (container.contains(canvasElement)) {
          container.removeChild(canvasElement);
        }
      };
    }
  }, [stream, canvas]);

  return (
    <StepCard title={config.title} subtitle={config.subtitle} onReject={() => { reject({}); }}>
      <Column style={{
        width: '100%',
        maxWidth: '100%',
        height: '100%',
        maxHeight: '100%',
        justifyContent: 'center',
        containerType: 'size',
      }} gap="1rem" align="center">

        <div style={{
          width: 'min(100cqw, 100cqh * (3 / 2))',
          aspectRatio: '3/2',
          backgroundColor: colors.gray900,
          borderRadius: '1rem',
          position: 'relative',
          overflow: 'hidden',
          border: `2px solid ${colors.gray900}`,
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
        }}>
          <video
            ref={videoReference}
            autoPlay
            playsInline
            muted
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div
            ref={ghostContainerReference}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10, display: 'flex' }}
          />
        </div>

        <Button
          type="button"
          variant="primary"
          style={{ padding: '0.75rem 1.5rem', fontSize: '1rem', width: '100%' }}
          onClick={() => { submit({ status: 'success' }); }}
        >
          Continue
        </Button>
      </Column>
    </StepCard>
  );
};

export const videoLiveStep: LiveStepDefinition = {
  executionType: 'VideoComponent',
  render: (properties) => <VideoComponent {...properties} />,
};
