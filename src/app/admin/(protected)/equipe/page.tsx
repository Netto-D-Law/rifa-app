import { createClient } from '@/lib/supabase/server';
import { formatDataHora } from '@/lib/format';
import { convidarAdminAction, desativarAdminAction, reativarAdminAction } from '../actions';
import ConvidarForm from './ConvidarForm';
import LinhaAdmin from './LinhaAdmin';

export const revalidate = 0;

export default async function EquipePage() {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();

  const { data: admins } = await supabase
    .from('admin_profiles')
    .select('*')
    .order('criado_em', { ascending: true });

  const { data: logs } = await supabase
    .from('admin_logs')
    .select('*')
    .order('criado_em', { ascending: false })
    .limit(50);

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="font-display text-2xl text-rotary-blueDark">Equipe</h1>
        <p className="mt-1 text-sm text-slate-500">
          Convide outros administradores por e-mail. Eles recebem um link para cadastrar a
          própria senha.
        </p>
      </div>

      <ConvidarForm action={convidarAdminAction} />

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-rotary-blueDark">
          Administradores
        </h2>
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-2.5">Nome</th>
                <th className="px-4 py-2.5">E-mail</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Desde</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {(admins ?? []).map((a) => (
                <LinhaAdmin
                  key={a.id}
                  admin={a}
                  souEu={a.id === userData?.user?.id}
                  onDesativar={desativarAdminAction}
                  onReativar={reativarAdminAction}
                />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-rotary-blueDark">
          Log de ações
        </h2>
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          {!logs || logs.length === 0 ? (
            <p className="p-6 text-center text-sm text-slate-400">Nenhuma ação registrada ainda.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-4 py-2.5">Quando</th>
                  <th className="px-4 py-2.5">Administrador</th>
                  <th className="px-4 py-2.5">Ação</th>
                  <th className="px-4 py-2.5">Detalhes</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} className="border-t border-slate-100">
                    <td className="px-4 py-2.5 text-slate-400">{formatDataHora(l.criado_em)}</td>
                    <td className="px-4 py-2.5 font-semibold">{l.admin_nome}</td>
                    <td className="px-4 py-2.5">{l.acao}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-400">
                      {JSON.stringify(l.detalhes)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
