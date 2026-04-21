import { StepCard } from '../StepCard';
import { Column, Row, Button } from '@/components/ui';
import { colors } from '@/styles/tokens';

import { type AeroStreamComponent } from 'aero-stream-pilot';
import React, { useEffect, useRef, useState } from 'react';

export const VideoComponent: AeroStreamComponent<React.ReactNode> = ({
  data,
  submit,
  reject,
  stream,
  canvas,
  layers
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const ghostContainerRef = useRef<HTMLDivElement>(null);
  const [faceLayer, setFaceLayer] = useState(true);
  const [handLayer, setHandLayer] = useState(true);

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

  useEffect(() => {
    layers({ face: faceLayer, hand: handLayer });
  }, [faceLayer, handLayer, layers]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit({ status: 'success' });
  };

  const handleReject = () => {
    reject({});
  };

  return (
    <StepCard title={config.title} subtitle={config.subtitle} onReject={handleReject}>
      <Column style={{
        width: '100%', maxWidth: "100%",
        height: '100%',
        maxHeight: "100%",
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
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)'
        }}>
          <video ref={videoRef} autoPlay playsInline muted
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div ref={ghostContainerRef}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10, display: 'flex' }} />
        </div>
        <Row gap="1rem" align="stretch" >
          <Button
            type="button"
            style={{ flex: 1, padding: '0.75rem 1.5rem', backgroundColor: faceLayer ? colors.amber600 : colors.gray500, color: colors.white, fontSize: '1rem', borderColor: 'transparent' }}
            onClick={() => { setFaceLayer(!faceLayer); }}
          >
            Face
          </Button>
          <Button
            type="button"
            style={{ flex: 1, padding: '0.75rem 1.5rem', backgroundColor: handLayer ? colors.amber600 : colors.gray500, color: colors.white, fontSize: '1rem', borderColor: 'transparent' }}
            onClick={() => { setHandLayer(!handLayer); }}
          >
            Hand
          </Button>
          <Button
            type="button"
            variant="primary"
            style={{ flex: 1, padding: '0.75rem 1.5rem', fontSize: '1rem', width: '100%' }}
            onClick={handleSubmit}
          >
            Continue
          </Button>
        </Row>
      </Column>
    </StepCard>
  );
}