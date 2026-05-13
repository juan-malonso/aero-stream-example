import { getControllerApiUrl } from '../config/workerEndpoints.ts';

export function getVideoUrl(sessionId: string, connectionId: string, download = false): string {
  const params = download ? '?download=1' : '';
  return `${getControllerApiUrl()}/videos/${encodeURIComponent(sessionId)}/${encodeURIComponent(connectionId)}${params}`;
}

export async function fetchControllerResourceUrl(resourcePath: string): Promise<string | null> {
  const res = await fetch(`${getControllerApiUrl()}/resources/${resourcePath}`);
  if (!res.ok) return null;
  const data = await res.json() as { url?: string };
  return typeof data.url === 'string' ? data.url : null;
}

export async function fetchControllerResourceJson<T>(resourcePath: string): Promise<T | null> {
  const url = await fetchControllerResourceUrl(resourcePath);
  if (!url) return null;
  const res = await fetch(url);
  if (!res.ok) return null;
  return await res.json() as T;
}

export async function fetchControllerVideoSegmentBuffer(viewingId: string, segment: string): Promise<ArrayBuffer | null> {
  const presignedRes = await fetch(`${getControllerApiUrl()}/resources/${viewingId}/video/${segment}`);
  if (!presignedRes.ok) return null;
  const json = await presignedRes.json() as { url: string };
  const segmentRes = await fetch(json.url);
  if (!segmentRes.ok) return null;
  return segmentRes.arrayBuffer();
}

export function downloadVideo(sessionId: string, connectionId?: string): void {
  if (!connectionId) return;

  const a = document.createElement('a');
  a.style.display = 'none';
  try {
    a.href = getVideoUrl(sessionId, connectionId, true);
  } catch (error) {
    console.error('Unable to build Controller video download URL:', error);
    return;
  }
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function openVideo(sessionId: string, connectionId?: string): void {
  if (!connectionId) return;

  try {
    window.open(getVideoUrl(sessionId, connectionId), '_blank', 'noopener,noreferrer');
  } catch (error) {
    console.error('Unable to build Controller video preview URL:', error);
  }
}
