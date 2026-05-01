import { getSessionDetail } from '@/lib/platform/store';
import { NextResponse } from 'next/server';

export async function GET(
  _request: Request,
  { params }: { params: { sessionId: string } },
): Promise<NextResponse> {
  const session = getSessionDetail(params.sessionId);

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  return NextResponse.json({ data: session });
}
