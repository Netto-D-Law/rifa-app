import { createClient } from '@/lib/supabase/server';
import { formatMoeda, formatDataHora, padNumero } from '@/lib/format';
import { confirmarPagamentoAction, liberarPedidoAction, liberarExpiradosAction } from './actions';
import LinhaPedido from './LinhaPedido';

export const revalidate = 0;

export default async function DashboardPage() {
  const supabase = await createClient();
  const slug = process.env.NEXT_PUBLIC_RAFFLE_SLUG!;

  const { data: raffle } = await supabase.from('raffles').select('*').eq('slug', slug).single();
  if (!raffle) return <p>Rifa não encontrada.</p>;

  const { data: numeros } = await supabase
    .from('raffle_numbers')
    .select('numero, pedido_id, status')
    .eq('raffle_id', raffle.id);

  const { data: pedidosPendentes } = await supabase
    .from('orders')
    .select('*')
    .eq('raffle_id', raffle.id)
    .eq('status', 'pendente')
    .order('criado_em', { ascending: true });

  const { data: pedidosConfirmados } = await supabase
    .from('orders')
    .select('*')
    .eq('raffle_id', raffle.id)
    .eq('status', 'confirmado')
    .order('confirmado_em', { ascending: false })
    .limit(20);

  const numerosPorPedido = new Map<string, number[]>();
  for (const n of numeros ?? []) {
    if (!n.pedido_id) continue;
    const lista = numerosPorPedido.get(n.pedido_id) ?? [];
    lista.push(n.numero);
    numerosPorPedido.set(n.pedido_id, lista);
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-rotary-blueDark">Pedidos</h1>
        <form action={async () => { 'use server'; await liberarExpiradosAction(raffle.id); }}>
          <button className="rounded-full border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50">
            Liberar reservas expiradas
          </button>
        </form>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-rotary-goldDark">
          Aguardando confirmação ({pedidosPendentes?.length ?? 0})
        </h2>
        {!pedidosPendentes || pedidosPendentes.length === 0 ? (
          <p className="rounded-xl bg-white p-6 text-center text-sm text-slate-400 shadow-sm">
            Nenhum pedido pendente.
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-4 py-2.5">Números</th>
                  <th className="px-4 py-2.5">Comprador</th>
                  <th className="px-4 py-2.5">WhatsApp</th>
                  <th className="px-4 py-2.5">Pagamento</th>
                  <th className="px-4 py-2.5">Valor</th>
                  <th className="px-4 py-2.5">Reservado em</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {pedidosPendentes.map((p) => (
                  <LinhaPedido
                    key={p.id}
                    pedido={p}
                    numeros={numerosPorPedido.get(p.id) ?? []}
                    totalNumeros={raffle.total_numeros}
                    onConfirmar={confirmarPagamentoAction}
                    onLiberar={liberarPedidoAction}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-rotary-blue">
          Confirmados recentemente
        </h2>
        {!pedidosConfirmados || pedidosConfirmados.length === 0 ? (
          <p className="rounded-xl bg-white p-6 text-center text-sm text-slate-400 shadow-sm">
            Nenhuma venda confirmada ainda.
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-4 py-2.5">Números</th>
                  <th className="px-4 py-2.5">Comprador</th>
                  <th className="px-4 py-2.5">Valor</th>
                  <th className="px-4 py-2.5">Confirmado em</th>
                </tr>
              </thead>
              <tbody>
                {pedidosConfirmados.map((p) => (
                  <tr key={p.id} className="border-t border-slate-100">
                    <td className="px-4 py-2.5 font-semibold">
                      {(numerosPorPedido.get(p.id) ?? [])
                        .map((n) => padNumero(n, raffle.total_numeros))
                        .join(', ')}
                    </td>
                    <td className="px-4 py-2.5">{p.nome}</td>
                    <td className="px-4 py-2.5">{formatMoeda(p.valor_total)}</td>
                    <td className="px-4 py-2.5 text-slate-400">{formatDataHora(p.confirmado_em)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
