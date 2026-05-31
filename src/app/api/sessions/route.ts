import { NextResponse } from 'next/server';

import { getSessionSummaries } from '@/lib/sessions/store';

export async function GET(): Promise<NextResponse> {
  const summaries = getSessionSummaries();
  return NextResponse.json({ data: summaries });
}
