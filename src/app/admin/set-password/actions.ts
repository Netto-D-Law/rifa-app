'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function definirSenha(formData: FormData) {
  const password = String(formData.get('password') ?? '');

  if (password.length < 8) {
    redirect('/admin/set-password?erro=senha_curta');
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect('/admin/set-password?erro=senha_curta');
  }

  redirect('/admin');
}
