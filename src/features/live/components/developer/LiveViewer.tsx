import { useEffect, useRef, useState } from 'react';
import { radii } from '@/styles/tokens';

export function LiveViewer({ viewingId, onClose }: { viewingId: string | null; onClose: () => void }) {
  const viewerVideoRef = useRef<HTMLVideoElement>(null);
  const [vttUrl, setVttUrl] = useState('');

  useEffect(() => {
    if (!viewingId || !viewerVideoRef.current) return;

    setVttUrl('');
    fetch(`http://localhost:8787/resources/${viewingId}/video/signature.vtt`)
      .then(res => res.ok ? res.json() : null)
      .then((data: unknown) => {
        if (typeof data === 'object' && data !== null && 'url' in data && typeof (data as { url: unknown }).url === 'string') {
          setVttUrl((data as { url: string }).url);
        }
      })
      .catch((e: unknown) => { console.error('Error fetching VTT:', e); });

    const video = viewerVideoRef.current;
    const mediaSource = new MediaSource();
    video.src = URL.createObjectURL(mediaSource);

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
        const presignedRes = await fetch(`http://localhost:8787/resources/${viewingId}/video/playlist.json`);
        if (!presignedRes.ok) return null;
        const json = await presignedRes.json() as { url: string };
        const playlistRes = await fetch(json.url);
        if (!playlistRes.ok) return null;
        return await playlistRes.json() as { segments: string[], isUploading: boolean };
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

      void pollPlaylist();
      fetchInterval = setInterval(() => { void pollPlaylist(); }, 3000);
    });

    return () => {
      isDestroyed = true;
      clearInterval(fetchInterval);
      if (mediaSource.readyState === 'open') {
        try { mediaSource.endOfStream(); } catch (e: unknown) { console.error('Error ending stream:', e); }
      }
    };
  }, [viewingId]);

  return (
    <div style={{
      width: '100%',
      overflow: 'hidden',
      borderRadius: radii.lg,
      aspectRatio: '16/9',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
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
