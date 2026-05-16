import { StepCard } from '../../live/StepCard';
import { Column, Button } from '@/components/ui';
import { colors } from '@/styles/tokens';

import { type AeroStreamComponent } from 'aero-stream-pilot';
import React, { useEffect, useRef } from 'react';
import type { LiveStepDefinition } from '../../types';

export const VideoComponent: AeroStreamComponent<React.ReactNode> = ({
  data,
  submit,
  reject,
  stream,
  canvas,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const ghostContainerRef = useRef<HTMLDivElement>(null);

  const config = data as {
    title?: string;
    subtitle?: string;
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream();
    }

    const container = ghostContainerRef.current;
    const canvasEl: HTMLCanvasElement = canvas();

    if (container) {
      canvasEl.style.position = 'absolute';
      canvasEl.style.top = '0';
      canvasEl.style.left = '0';
      canvasEl.style.width = '100%';
      canvasEl.style.height = '100%';
      canvasEl.style.objectFit = 'cover';

      container.appendChild(canvasEl);

      return () => {
        if (container.contains(canvasEl)) {
          container.removeChild(canvasEl);
        }
      };
    }
  }, [stream, canvas]);

  return (
    <StepCard title={config.title} subtitle={config.subtitle} onReject={() => reject({})}>
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
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div
            ref={ghostContainerRef}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10, display: 'flex' }}
          />
        </div>

        <Button
          type="button"
          variant="primary"
          style={{ padding: '0.75rem 1.5rem', fontSize: '1rem', width: '100%' }}
          onClick={() => submit({ status: 'success' })}
        >
          Continue
        </Button>
      </Column>
    </StepCard>
  );
};

export const videoLiveStep: LiveStepDefinition = {
  executionType: 'VideoComponent',
  render: (props) => <VideoComponent {...props} />,
};
