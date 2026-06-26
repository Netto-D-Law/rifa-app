import { createClient } from '@/lib/supabase/server';
import RaffleView from '@/components/public/RaffleView';
import type { Raffle, RaffleNumber } from '@/lib/types';

export const revalidate = 0;

export default async function HomePage() {
  const supabase = await createClient();
  const slug = process.env.NEXT_PUBLIC_RAFFLE_SLUG!;

  const { data: raffle, error: raffleError } = await supabase
    .from('raffles')
    .select('*')
    .eq('slug', slug)
    .single();

  if (raffleError || !raffle) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6 text-center">
        <div>
          <h1 className="font-display text-2xl text-rotary-blueDark">Rifa não encontrada</h1>
          <p className="mt-2 text-sm text-slate-500">
            Verifique se <code>NEXT_PUBLIC_RAFFLE_SLUG</code> no .env.local corresponde a uma rifa
            criada no banco.
          </p>
        </div>
      </main>
    );
  }

  const { data: numeros } = await supabase
    .from('raffle_numbers')
    .select('*')
    .eq('raffle_id', raffle.id)
    .order('numero', { ascending: true });

  return <RaffleView raffle={raffle as Raffle} numerosIniciais={(numeros ?? []) as RaffleNumber[]} />;
}
