import { getControllerAdminHeaders, getControllerApiUrl } from '../config/workerEndpoints.ts';

export function getVideoUrl(sessionId: string, connectionId: string): string {
  return `${getControllerApiUrl()}/videos/${encodeURIComponent(sessionId)}/${encodeURIComponent(connectionId)}/url`;
}

export async function getControllerVideoUrl(sessionId: string, connectionId: string, download = false): Promise<string | null> {
  const params = download ? '?download=1' : '';
  const res = await fetch(`${getVideoUrl(sessionId, connectionId)}${params}`, {
    headers: getControllerAdminHeaders(),
  });
  if (!res.ok) return null;
  const data = await res.json() as { url?: string };
  return typeof data.url === 'string' ? data.url : null;
}

export async function fetchControllerResourceUrl(resourcePath: string): Promise<string | null> {
  const res = await fetch(`${getControllerApiUrl()}/resources/${resourcePath}`, {
    headers: getControllerAdminHeaders(),
  });
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
  const presignedRes = await fetch(`${getControllerApiUrl()}/resources/${viewingId}/video/${segment}`, {
    headers: getControllerAdminHeaders(),
  });
  if (!presignedRes.ok) return null;
  const json = await presignedRes.json() as { url: string };
  const segmentRes = await fetch(json.url);
  if (!segmentRes.ok) return null;
  return segmentRes.arrayBuffer();
}

export function downloadVideo(sessionId: string, connectionId?: string): void {
  if (!connectionId) return;

  void getControllerVideoUrl(sessionId, connectionId, true).then((url) => {
    if (!url) return;
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }).catch((error: unknown) => {
    console.error('Unable to build Controller video download URL:', error);
  });
}

export function openVideo(sessionId: string, connectionId?: string): void {
  if (!connectionId) return;

  void getControllerVideoUrl(sessionId, connectionId).then((url) => {
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  }).catch((error: unknown) => {
    console.error('Unable to build Controller video preview URL:', error);
  });
}
