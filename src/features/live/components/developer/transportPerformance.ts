import type { AeroStreamTransportEvent } from 'aero-stream-pilot';
import { useCallback, useEffect, useRef, useState } from 'react';

const RATE_WINDOW_MS = 5000;
const SNAPSHOT_INTERVAL_MS = 500;

type TransportDirection = AeroStreamTransportEvent['direction'];

interface TransportSample {
  atMs: number;
  bytes: number;
  direction: TransportDirection;
}

interface MutableTransportPerformance {
  inboundBytes: number;
  inboundMessages: number;
  lastActivityAtMs: number | null;
  lastDirection: TransportDirection | null;
  lastEncodedBytes: number;
  lastMediaBytes: number;
  lastType: string | null;
  outboundBytes: number;
  outboundMediaBytes: number;
  outboundMessages: number;
  outboundVideoMessages: number;
  samples: TransportSample[];
}

export interface TransportPerformanceStats {
  inboundBytes: number;
  inboundBytesPerSecond: number;
  inboundMessages: number;
  lastActivityAgeMs: number | null;
  lastDirection: TransportDirection | null;
  lastEncodedBytes: number;
  lastMediaBytes: number;
  lastType: string | null;
  outboundBytes: number;
  outboundBytesPerSecond: number;
  outboundMediaBytes: number;
  outboundMessages: number;
  outboundVideoMessages: number;
}

export function useTransportPerformance() {
  const metricsReference = useRef(createEmptyMutableTransportPerformance());
  const [stats, setStats] = useState(() => createTransportSnapshot(metricsReference.current));

  const recordTransportEvent = useCallback((event: AeroStreamTransportEvent) => {
    const metrics = metricsReference.current;
    const bytes = Math.max(0, event.encodedBytes);

    metrics.lastActivityAtMs = performance.now();
    metrics.lastDirection = event.direction;
    metrics.lastEncodedBytes = bytes;
    metrics.lastMediaBytes = event.mediaBytes ?? 0;
    metrics.lastType = event.type;

    if (event.direction === 'outbound') {
      metrics.outboundBytes += bytes;
      metrics.outboundMediaBytes += event.mediaBytes ?? 0;
      metrics.outboundMessages += 1;
      if (event.type === 'VIDEO') {
        metrics.outboundVideoMessages += 1;
      }
    } else {
      metrics.inboundBytes += bytes;
      metrics.inboundMessages += 1;
    }

    metrics.samples.push({ atMs: performance.now(), bytes, direction: event.direction });
    pruneSamples(metrics.samples, performance.now());
  }, []);

  const resetTransportPerformance = useCallback(() => {
    metricsReference.current = createEmptyMutableTransportPerformance();
    setStats(createTransportSnapshot(metricsReference.current));
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setStats(createTransportSnapshot(metricsReference.current));
    }, SNAPSHOT_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  return { recordTransportEvent, resetTransportPerformance, transportStats: stats };
}

function createEmptyMutableTransportPerformance(): MutableTransportPerformance {
  return {
    inboundBytes: 0,
    inboundMessages: 0,
    lastActivityAtMs: null,
    lastDirection: null,
    lastEncodedBytes: 0,
    lastMediaBytes: 0,
    lastType: null,
    outboundBytes: 0,
    outboundMediaBytes: 0,
    outboundMessages: 0,
    outboundVideoMessages: 0,
    samples: [],
  };
}

function createTransportSnapshot(metrics: MutableTransportPerformance): TransportPerformanceStats {
  const now = performance.now();
  pruneSamples(metrics.samples, now);

  return {
    inboundBytes: metrics.inboundBytes,
    inboundBytesPerSecond: bytesPerSecond(metrics.samples, 'inbound', now),
    inboundMessages: metrics.inboundMessages,
    lastActivityAgeMs: metrics.lastActivityAtMs === null ? null : now - metrics.lastActivityAtMs,
    lastDirection: metrics.lastDirection,
    lastEncodedBytes: metrics.lastEncodedBytes,
    lastMediaBytes: metrics.lastMediaBytes,
    lastType: metrics.lastType,
    outboundBytes: metrics.outboundBytes,
    outboundBytesPerSecond: bytesPerSecond(metrics.samples, 'outbound', now),
    outboundMediaBytes: metrics.outboundMediaBytes,
    outboundMessages: metrics.outboundMessages,
    outboundVideoMessages: metrics.outboundVideoMessages,
  };
}

function pruneSamples(samples: TransportSample[], now: number): void {
  while (samples.length > 0 && now - samples[0].atMs > RATE_WINDOW_MS) {
    samples.shift();
  }
}

function bytesPerSecond(samples: TransportSample[], direction: TransportDirection, now: number): number {
  const directionSamples = samples.filter((sample) => sample.direction === direction);
  if (directionSamples.length === 0) return 0;

  const bytes = directionSamples.reduce((total, sample) => total + sample.bytes, 0);
  const oldestSample = directionSamples[0];
  const elapsedMs = Math.max(1000, Math.min(RATE_WINDOW_MS, now - oldestSample.atMs));
  return Math.round(bytes / (elapsedMs / 1000));
}
