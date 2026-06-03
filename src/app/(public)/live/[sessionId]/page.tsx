import { PlayerApp } from '@/modules/aero-stream-player/app';

interface RunnerPageProperties {
  params: Promise<{ sessionId: string }>;
}

export default async function RunnerPage({ params }: RunnerPageProperties) {
  const { sessionId } = await params;
  return <PlayerApp sessionId={sessionId} />;
}
