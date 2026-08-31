import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const schema = z.object({
  name: z.string().trim().min(2).max(100), phone: z.string().trim().min(6).max(30),
  email: z.union([z.email().max(160), z.literal('')]).optional(),
  workType: z.enum(['renovation','new-build','repair','other']), area: z.string().trim().min(2).max(120),
  preferredDate: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.literal('')]).optional(),
  preferredTime: z.union([z.string().regex(/^\d{2}:\d{2}$/), z.literal('')]).optional(),
  message: z.string().trim().min(10).max(1500), website: z.string().max(0).optional(),
});

const attempts = new Map<string, { count: number; reset: number }>();
const rateLimitSalt = crypto.randomUUID();

async function rateLimitKey(ip: string) {
  const bytes = new TextEncoder().encode(`${rateLimitSalt}:${ip}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for')?.split(',')[0] || 'local';
  const now = Date.now();
  for (const [key, attempt] of attempts) if (attempt.reset <= now) attempts.delete(key);
  const key = await rateLimitKey(ip);
  const current = attempts.get(key); if (current && current.reset > now && current.count >= 5) return NextResponse.json({ message: 'Please wait before submitting another request.' }, { status: 429 });
  attempts.set(key, !current || current.reset <= now ? { count: 1, reset: now + 10 * 60_000 } : { ...current, count: current.count + 1 });
  let body: unknown; try { body = await request.json(); } catch { return NextResponse.json({ message: 'Invalid request.' }, { status: 400 }); }
  const parsed = schema.safeParse(body); if (!parsed.success) return NextResponse.json({ message: 'Please check the form fields.' }, { status: 422 });
  const supabase = createSupabaseServerClient(); if (!supabase) return NextResponse.json({ ok: true, preview: true });
  const value = parsed.data; const { error } = await supabase.from('appointment_requests').insert({ name: value.name, phone: value.phone, email: value.email || null, work_type: value.workType, area: value.area, preferred_date: value.preferredDate || null, preferred_time: value.preferredTime || null, message: value.message });
  if (error) return NextResponse.json({ message: 'The request could not be saved.' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
