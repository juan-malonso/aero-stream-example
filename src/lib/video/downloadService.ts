const TOWER_URL = 'http://localhost:8787';

export async function downloadVideo(sessionId: string, connectionId?: string): Promise<void> {
  if (!connectionId) return;
  const basePath = `${sessionId}/${connectionId}`;
  try {
    const playlistRes = await fetch(`${TOWER_URL}/resources/${basePath}/playlist.json`);
    if (!playlistRes.ok) throw new Error('Failed to fetch video playlist');
    const { url: playlistUrl } = await playlistRes.json() as { url: string };

    const playlistDataRes = await fetch(playlistUrl);
    if (!playlistDataRes.ok) throw new Error('Failed to download playlist');
    const playlist = await playlistDataRes.json() as { segments: string[] };

    const buffers: ArrayBuffer[] = [];
    for (const segment of playlist.segments) {
      const segRes = await fetch(`${TOWER_URL}/resources/${basePath}/${segment}`);
      if (!segRes.ok) continue;
      const { url: segUrl } = await segRes.json() as { url: string };
      const segDataRes = await fetch(segUrl);
      if (segDataRes.ok) {
        buffers.push(await segDataRes.arrayBuffer());
      }
    }

    if (buffers.length === 0) throw new Error('No video segments found');

    const blob = new Blob(buffers, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `video-${sessionId}-${connectionId.slice(0, 8)}.webm`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error downloading video:', error);
    alert('An error occurred while downloading the video.');
  }
}
