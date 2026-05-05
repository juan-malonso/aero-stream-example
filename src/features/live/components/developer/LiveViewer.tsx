import { useEffect, useRef, useState } from 'react';
import { radii } from '@/styles/tokens';

const TOWER_URL = 'http://localhost:8787';

interface RecordingMetadata {
  status: 'recording' | 'finalized' | 'finalized_with_gaps' | 'failed' | 'failed_with_partial';
  objectKey: string;
  signatureTrackKey?: string;
  gapsTrackKey?: string;
  missingRanges?: unknown[];
}

async function fetchPresignedUrl(resourcePath: string): Promise<string | null> {
  const res = await fetch(`${TOWER_URL}/resources/${resourcePath}`);
  if (!res.ok) return null;
  const data = await res.json() as { url?: string };
  return typeof data.url === 'string' ? data.url : null;
}

async function fetchPresignedJson<T>(resourcePath: string): Promise<T | null> {
  const url = await fetchPresignedUrl(resourcePath);
  if (!url) return null;
  const res = await fetch(url);
  if (!res.ok) return null;
  return await res.json() as T;
}

export function LiveViewer({ viewingId, onClose }: { viewingId: string | null; onClose: () => void }) {
  const viewerVideoRef = useRef<HTMLVideoElement>(null);
  const [vttUrl, setVttUrl] = useState('');
  const [gapWarning, setGapWarning] = useState('');

  useEffect(() => {
    if (!viewingId || !viewerVideoRef.current) return;

    setVttUrl('');
    setGapWarning('');

    const video = viewerVideoRef.current;
    const mediaSource = new MediaSource();
    let mediaSourceUrl = URL.createObjectURL(mediaSource);
    video.src = mediaSourceUrl;

    let sourceBuffer: SourceBuffer | undefined;
    let isDestroyed = false;
    let fetchInterval: ReturnType<typeof setInterval> | undefined;
    const loadedSegments = new Set<string>();
    const queue: string[] = [];
    let isAppending = false;

    const fetchSegmentBuffer = async (segment: string): Promise<ArrayBuffer | null> => {
      const presignedRes = await fetch(`http://localhost:8787/resources/${viewingId}/video/${segment}`);
      if (!presignedRes.ok) return null;
      const json = await presignedRes.json() as { url: string };
      const segmentRes = await fetch(json.url);
      if (!segmentRes.ok) return null;
      return segmentRes.arrayBuffer();
    };

    const tryLoadSingleRecording = async (): Promise<boolean> => {
      const metadata = await fetchPresignedJson<RecordingMetadata>(`${viewingId}/recording.json`);
      if (!metadata || (metadata.status !== 'finalized' && metadata.status !== 'finalized_with_gaps')) return false;

      const recordingUrl = await fetchPresignedUrl(metadata.objectKey);
      if (!recordingUrl || isDestroyed) return false;

      video.src = recordingUrl;
      URL.revokeObjectURL(mediaSourceUrl);
      mediaSourceUrl = '';

      if (metadata.signatureTrackKey) {
        const signatureUrl = await fetchPresignedUrl(metadata.signatureTrackKey);
        if (signatureUrl && !isDestroyed) setVttUrl(signatureUrl);
      }
      if (metadata.status === 'finalized_with_gaps') {
        setGapWarning(`Recording finalized with ${String(metadata.missingRanges?.length ?? 0)} missing range(s).`);
      }
      return true;
    };

    const processQueue = async () => {
      if (isAppending || queue.length === 0 || isDestroyed || !sourceBuffer || sourceBuffer.updating) return;
      isAppending = true;
      const segment = queue.shift();
      if (!segment) {
        isAppending = false;
        return;
      }
      try {
        const arrayBuffer = await fetchSegmentBuffer(segment);
        if (arrayBuffer) {
          sourceBuffer.appendBuffer(arrayBuffer);
          return; // Will set isAppending = false inside updateend event
        }
      } catch (e: unknown) {
        console.error('Error fetching/appending segment:', e);
      }
      isAppending = false;
      if (queue.length > 0) void processQueue();
    };

    mediaSource.addEventListener('sourceopen', () => {
      try {
        const mime = 'video/webm; codecs="vp8,opus"';
        sourceBuffer = mediaSource.addSourceBuffer(MediaSource.isTypeSupported(mime) ? mime : 'video/webm');
        sourceBuffer.addEventListener('updateend', () => {
          isAppending = false;
          void processQueue();
        });
      } catch (e: unknown) {
        console.error('Error adding source buffer:', e);
        return;
      }

      const fetchPlaylist = async () => {
        return await fetchPresignedJson<{ segments: string[], isUploading: boolean }>(`${viewingId}/video/playlist.json`);
      };

      const pollPlaylist = async () => {
        if (isDestroyed) return;
        try {
          const playlist = await fetchPlaylist();
          if (!playlist) return;

          let hasNew = false;
          for (const seg of playlist.segments) {
            if (!loadedSegments.has(seg)) {
              loadedSegments.add(seg);
              queue.push(seg);
              hasNew = true;
            }
          }
          if (hasNew) void processQueue();

          if (!playlist.isUploading && queue.length === 0 && !isAppending) {
            clearInterval(fetchInterval);
            setTimeout(() => {
              if (mediaSource.readyState === 'open' && sourceBuffer && !sourceBuffer.updating) {
                mediaSource.endOfStream();
              }
            }, 500);
          }
        } catch (e: unknown) {
          console.error('Error polling playlist:', e);
        }
      };

      void tryLoadSingleRecording().then((loaded) => {
        if (loaded || isDestroyed) return;

        void fetchPresignedUrl(`${viewingId}/video/signature.vtt`)
          .then((url) => {
            if (url && !isDestroyed) setVttUrl(url);
          })
          .catch((e: unknown) => { console.error('Error fetching VTT:', e); });

        void pollPlaylist();
        fetchInterval = setInterval(() => { void pollPlaylist(); }, 3000);
      });
    });

    return () => {
      isDestroyed = true;
      clearInterval(fetchInterval);
      if (mediaSourceUrl) URL.revokeObjectURL(mediaSourceUrl);
      if (mediaSource.readyState === 'open') {
        try { mediaSource.endOfStream(); } catch (e: unknown) { console.error('Error ending stream:', e); }
      }
    };
  }, [viewingId]);

  return (
    <div style={{
      width: '100%',
      position: 'relative',
      overflow: 'hidden',
      borderRadius: radii.lg,
      aspectRatio: '16/9',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {gapWarning && (
        <div style={{
          position: 'absolute',
          zIndex: 1,
          top: '0.5rem',
          left: '0.5rem',
          right: '0.5rem',
          padding: '0.35rem 0.5rem',
          background: 'rgba(0,0,0,0.72)',
          color: 'white',
          fontSize: '0.75rem',
          borderRadius: '6px',
          pointerEvents: 'none',
          textAlign: 'center',
        }}>
          {gapWarning}
        </div>
      )}
      <video
        ref={viewerVideoRef}
        autoPlay
        controls
        crossOrigin="anonymous"
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      >
        {vttUrl && <track default kind="subtitles" srcLang="es" label="Firma" src={vttUrl} />}
      </video>
    </div>
  );
}
