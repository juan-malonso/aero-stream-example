export async function downloadVideo(id: string): Promise<void> {
  try {
    const playlistRes = await fetch(`http://localhost:8787/resources/${id}/video/playlist.json`);
    if (!playlistRes.ok) throw new Error('Failed to fetch video playlist');
    const { url: playlistUrl } = await playlistRes.json() as { url: string };

    const playlistDataRes = await fetch(playlistUrl);
    if (!playlistDataRes.ok) throw new Error('Failed to download playlist');
    const playlist = await playlistDataRes.json() as { segments: string[] };

    const buffers: ArrayBuffer[] = [];
    for (const segment of playlist.segments) {
      const segRes = await fetch(`http://localhost:8787/resources/${id}/video/${segment}`);
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
    a.download = `video-${id}.webm`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error downloading video:', error);
    alert('An error occurred while downloading the video.');
  }
}
