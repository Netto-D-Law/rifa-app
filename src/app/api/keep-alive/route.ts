import { NextResponse } from 'next/server';

// Keep-alive: mantem o projeto Supabase (plano free) acordado.
// O free pausa apos 7 dias sem atividade no banco; este endpoint faz
// uma consulta leve e e chamado 1x/dia pelo Vercel Cron (ver vercel.json).
export const dynamic = 'force-dynamic';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    return NextResponse.json(
      { ok: false, error: 'Variaveis do Supabase ausentes' },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(`${url}/rest/v1/raffles?select=id&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: 'no-store',
    });
    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      ts: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
