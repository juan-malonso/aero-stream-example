import { getSessionSummaries } from '@/lib/sessions/store';
import { NextResponse } from 'next/server';

export async function GET(): Promise<NextResponse> {
  const summaries = getSessionSummaries();
  return NextResponse.json({ data: summaries });
}
