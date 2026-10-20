import { NextResponse } from 'next/server';
export const fail = (message: string, status: number) => NextResponse.json({ error: message }, { status });
