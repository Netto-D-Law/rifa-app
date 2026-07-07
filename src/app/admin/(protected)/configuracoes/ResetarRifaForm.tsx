'use client';

import { useState } from 'react';

const FRASE_CONFIRMACAO = 'Liberar todos os números';

interface Props {
  action: () => Promise<{ ok: boolean; erro?: string; quantidade?: number }>;
}

export default function ResetarRifaForm({ action }: Props) {
  const [frase, setFrase] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);

  const frasesConferem = frase === FRASE_CONFIRMACAO;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!frasesConferem) return;

    const confirmouDeNovo = window.confirm(
      'Tem certeza? Isso vai liberar TODOS os números da rifa (cancelando pedidos pendentes e confirmados). Essa ação não pode ser desfeita.'
    );
    if (!confirmouDeNovo) return;

    setCarregando(true);
    const resp = await action();
    setCarregando(false);
    setFrase('');

    setMensagem(
      resp.ok
        ? { tipo: 'ok', texto: `Pronto! ${resp.quantidade ?? 0} pedido(s) liberado(s). Todos os números voltaram a ficar disponíveis.` }
        : { tipo: 'erro', texto: resp.erro ?? 'Erro ao resetar a rifa.' }
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border-2 border-red-200 bg-red-50 p-6 shadow-sm"
    >
      <h2 className="mb-1 text-sm font-bold text-red-700">Zona de risco — Resetar rifa</h2>
      <p className="mb-3 text-xs text-red-700/80">
        Libera <strong>todos</strong> os números da rifa (voltam para "disponível") e cancela
        todos os pedidos pendentes e confirmados. Use isso apenas para recomeçar a rifa do zero.
        Esta ação não pode ser desfeita.
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
        {carregando ? 'Liberando…' : 'Resetar rifa (liberar todos os números)'}
      </button>
      {mensagem && (
        <p className={`mt-3 text-sm ${mensagem.tipo === 'ok' ? 'text-rotary-green' : 'text-red-700'}`}>
          {mensagem.texto}
        </p>
      )}
    </form>
  );
}
