import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { EmailOtpType } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';

// Para onde o e-mail de convite do Supabase Auth redireciona depois de
// validar o link. Troca o token do e-mail por uma sessão de fato logada.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next') ?? '/admin';

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      redirect(next);
    }
  }

  redirect('/admin/login?erro=link_invalido_ou_expirado');
}
