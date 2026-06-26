import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// ATENÇÃO: usa a Secret key (service_role). Só pode ser importado em código
// que roda no servidor (Server Actions, Route Handlers) — nunca em um
// componente marcado com 'use client', e nunca enviado para o navegador.
// Usado apenas para a ação administrativa de convidar novos administradores.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
