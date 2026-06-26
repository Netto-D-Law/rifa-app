import { createClient } from '@/lib/supabase/server';
import { atualizarConfigAction, atualizarImagemAction, expandirNumerosAction } from '../actions';
import ImageUploader from '@/components/admin/ImageUploader';
import SalvarConfigForm from './SalvarConfigForm';
import ExpandirNumerosForm from './ExpandirNumerosForm';

export const revalidate = 0;

export default async function ConfiguracoesPage() {
  const supabase = await createClient();
  const slug = process.env.NEXT_PUBLIC_RAFFLE_SLUG!;
  const { data: raffle } = await supabase.from('raffles').select('*').eq('slug', slug).single();

  if (!raffle) return <p>Rifa não encontrada.</p>;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-display text-2xl text-rotary-blueDark">Configurações da rifa</h1>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-sm font-bold text-rotary-blueDark">Foto do prêmio</h2>
        <p className="mb-3 text-xs text-slate-400">Aparece na aba "Prêmio" do site público.</p>
        <ImageUploader
          valorInicial={raffle.imagem_url}
          onUpload={atualizarImagemAction.bind(null, raffle.id)}
        />
      </div>

      <SalvarConfigForm raffle={raffle} action={atualizarConfigAction.bind(null, raffle.id)} />

      <ExpandirNumerosForm
        totalAtual={raffle.total_numeros}
        action={expandirNumerosAction.bind(null, raffle.id)}
      />
    </div>
  );
}
