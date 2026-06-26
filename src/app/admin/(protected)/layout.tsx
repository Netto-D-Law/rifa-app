import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AdminNav from '@/components/admin/AdminNav';

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    redirect('/admin/login');
  }

  const { data: perfil } = await supabase
    .from('admin_profiles')
    .select('*')
    .eq('id', userData.user.id)
    .single();

  if (!perfil || !perfil.ativo) {
    redirect('/admin/login?erro=credenciais_invalidas');
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminNav nomeAdmin={perfil.nome} />
      <div className="mx-auto max-w-5xl px-5 py-8">{children}</div>
    </div>
  );
}
