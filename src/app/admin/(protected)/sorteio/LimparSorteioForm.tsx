'use client';

import { useState } from 'react';

const FRASE_CONFIRMACAO = 'Resetar sorteado';

interface Props {
  action: () => Promise<{ ok: boolean; erro?: string }>;
}

export default function LimparSorteioForm({ action }: Props) {
  const [frase, setFrase] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);

  const frasesConferem = frase === FRASE_CONFIRMACAO;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!frasesConferem) return;

    setCarregando(true);
    const resp = await action();
    setCarregando(false);
    setFrase('');

    setMensagem(
      resp.ok
        ? { tipo: 'ok', texto: 'Pronto! O número sorteado foi apagado do site e do painel.' }
        : { tipo: 'erro', texto: resp.erro ?? 'Erro ao limpar o sorteio.' }
    );

    if (resp.ok) {
      // Recarrega a página para a tela de sorteio (DrawStage) refletir o
      // estado limpo imediatamente, já que ela guarda o vencedor em estado
      // local montado a partir dos dados do servidor.
      window.location.reload();
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 rounded-xl border-2 border-red-200 bg-red-50 p-6 shadow-sm"
    >
      <h2 className="mb-1 text-sm font-bold text-red-700">Limpar número sorteado</h2>
      <p className="mb-3 text-xs text-red-700/80">
        Apaga o resultado do sorteio atual (útil depois de um sorteio de teste, ou depois de
        resetar a rifa) — some tanto do site público quanto desta tela e do painel
        administrador. Não mexe nos números da rifa.
      </p>
      <label className="mb-1 block text-xs font-semibold text-red-700">
        Digite exatamente <strong>&quot;{FRASE_CONFIRMACAO}&quot;</strong> para habilitar o botão:
      </label>
      <input
        value={frase}
        onChange={(e) => setFrase(e.target.value)}
        placeholder={FRASE_CONFIRMACAO}
        className="mb-3 w-full rounded-lg border border-red-300 bg-white px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
      />
      <button
        type="submit"
        disabled={!frasesConferem || carregando}
        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {carregando ? 'Limpando…' : 'Limpar número sorteado'}
      </button>
      {mensagem && (
        <p className={`mt-3 text-sm ${mensagem.tipo === 'ok' ? 'text-rotary-green' : 'text-red-700'}`}>
          {mensagem.texto}
        </p>
      )}
    </form>
  );
}
