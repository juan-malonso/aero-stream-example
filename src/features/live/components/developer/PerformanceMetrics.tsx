import { ConnectionStatus } from '@/constants';
import { colors, typography } from '@/styles/tokens';

import { useEffect, useState } from 'react';
import { toolboxItemStyle } from '@/styles/theme';

function usePerformanceMetrics() {
  const [fps, setFps] = useState(0);
  const [memoryUsage, setMemoryUsage] = useState('N/A');

  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();
    let frames = 0;

    const updateMetrics = () => {
      const now = performance.now();
      frames++;

      if (now - lastTime >= 1000) {
        setFps(Math.round((frames * 1000) / (now - lastTime)));
        frames = 0;
        lastTime = now;

        const perf = performance as unknown as { memory?: { usedJSHeapSize: number } };
        if (perf.memory) {
          const used = Math.round(perf.memory.usedJSHeapSize / 1024 / 1024);
          setMemoryUsage(`${used.toString()} MB`);
        }
      }
      animationFrameId = requestAnimationFrame(updateMetrics);
    };
    animationFrameId = requestAnimationFrame(updateMetrics);
    return () => { cancelAnimationFrame(animationFrameId); };
  }, []);

  return { fps, memoryUsage };
}

export function PerformanceStats({ status, connectionTime }: { status: ConnectionStatus; connectionTime: number }) {
  const { fps, memoryUsage } = usePerformanceMetrics();
  const formatTime = (seconds: number) =>
    `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;

  const getStatusColor = () => {
    switch (status) {
      case ConnectionStatus.active: return colors.emerald500;
      case ConnectionStatus.error: return colors.red500;
      default: return colors.gray500;
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', width: '100%', boxSizing: 'border-box' }}>
      <PerformanceCard title="Status" color={getStatusColor()}>
        <span style={{ fontSize: typography.sizes.lg, fontWeight: 700, color: getStatusColor(), textTransform: 'capitalize' }}>• {status}</span>
      </PerformanceCard>
      <PerformanceCard title="Uptime" color={colors.amber500}>
        <span style={{ fontSize: typography.sizes.lg, fontWeight: 700, color: colors.gray800, textTransform: 'capitalize' }}>{formatTime(connectionTime)}</span>
      </PerformanceCard>
      <PerformanceCard title="Performance" color={colors.emerald500}>
        <span style={{ fontSize: typography.sizes.lg, fontWeight: 700, color: colors.gray800, textTransform: 'capitalize' }}>{fps}</span>
        <span style={{ fontSize: typography.sizes.sm, fontWeight: 500, color: colors.gray400, marginLeft: '4px' }}>FPS</span>
      </PerformanceCard>
      <PerformanceCard title="Memory" color={colors.blue500}>
        <span style={{ fontSize: typography.sizes.lg, fontWeight: 700, color: colors.gray800, textTransform: 'capitalize' }}>{memoryUsage}</span>
      </PerformanceCard>
    </div>
  );
}

function PerformanceCard({ title, children, color }: { title: string; children: React.ReactNode; color: string }) {
  const labelStyle = {
    fontSize: typography.sizes.xs,
    color: colors.gray400,
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    width: '100%',
    marginBottom: '2px'
  };

  return (
    <div style={{ ...toolboxItemStyle(color), padding: '0.5rem' }}>
      <div>
        <div style={labelStyle}>{title}</div>
        {children}
      </div>
    </div>
  );
}