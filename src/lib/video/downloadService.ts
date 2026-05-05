const TOWER_URL = 'http://localhost:8787';

function getVideoUrl(sessionId: string, connectionId: string, download = false): string {
  const params = download ? '?download=1' : '';
  return `${TOWER_URL}/videos/${encodeURIComponent(sessionId)}/${encodeURIComponent(connectionId)}${params}`;
}

export function downloadVideo(sessionId: string, connectionId?: string): void {
  if (!connectionId) return;

  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = getVideoUrl(sessionId, connectionId, true);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function openVideo(sessionId: string, connectionId?: string): void {
  if (!connectionId) return;

  window.open(getVideoUrl(sessionId, connectionId), '_blank', 'noopener,noreferrer');
}
