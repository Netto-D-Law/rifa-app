import { createClient } from '@/lib/supabase/server';
import { sortearVencedorAction, limparSorteioAction } from '../actions';
import DrawStage from '@/components/admin/DrawStage';
import LimparSorteioForm from './LimparSorteioForm';

export const revalidate = 0;

export default async function SorteioPage() {
  const supabase = await createClient();
  const slug = process.env.NEXT_PUBLIC_RAFFLE_SLUG!;
  const { data: raffle } = await supabase.from('raffles').select('*').eq('slug', slug).single();

  if (!raffle) return <p>Rifa não encontrada.</p>;

  const { data: numerosVendidos } = await supabase
    .from('raffle_numbers')
    .select('numero, pedido_id')
    .eq('raffle_id', raffle.id)
    .eq('status', 'vendido');

  const pedidoIds = (numerosVendidos ?? []).map((n) => n.pedido_id).filter(Boolean) as string[];
  const { data: pedidos } = pedidoIds.length
    ? await supabase.from('orders').select('id, nome').in('id', pedidoIds)
    : { data: [] };

  const nomesPorPedido = new Map((pedidos ?? []).map((p) => [p.id, p.nome]));
  const participantes = (numerosVendidos ?? []).map((n) => ({
    numero: n.numero,
    nome: nomesPorPedido.get(n.pedido_id!) ?? '—',
  }));

  return (
    <div>
      <DrawStage
        raffle={raffle}
        participantes={participantes}
        onSortear={sortearVencedorAction.bind(null, raffle.id)}
      />
      <LimparSorteioForm action={limparSorteioAction.bind(null, raffle.id)} />
    </div>
  );
}
