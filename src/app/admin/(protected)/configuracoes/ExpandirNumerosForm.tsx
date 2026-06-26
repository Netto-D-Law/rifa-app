'use client';

import { useState } from 'react';

interface Props {
  totalAtual: number;
  action: (novoTotal: number) => Promise<{ ok: boolean; erro?: string }>;
}

export default function ExpandirNumerosForm({ totalAtual, action }: Props) {
  const [novoTotal, setNovoTotal] = useState(totalAtual);
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (novoTotal <= totalAtual) {
      setMensagem({ tipo: 'erro', texto: 'Use um valor maior que o total atual para expandir.' });
      return;
    }
    setCarregando(true);
    const resp = await action(novoTotal);
    setCarregando(false);
    setMensagem(
      resp.ok
        ? { tipo: 'ok', texto: `Rifa expandida para ${novoTotal} números.` }
        : { tipo: 'erro', texto: resp.erro ?? 'Erro ao expandir.' }
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl bg-white p-6 shadow-sm">
      <h2 className="mb-1 text-sm font-bold text-rotary-blueDark">Quantidade de números</h2>
      <p className="mb-3 text-xs text-slate-400">
        Atualmente: <strong>{totalAtual}</strong> números. Você pode aumentar para reutilizar
        este site em outra ação — números já vendidos nunca são afetados.
      </p>
      <div className="flex items-center gap-3">
        <input
          type="number"
          min={totalAtual}
          value={novoTotal}
          onChange={(e) => setNovoTotal(Number(e.target.value))}
          className="w-32 rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={carregando}
          className="rounded-lg border border-rotary-blue px-4 py-2 text-sm font-semibold text-rotary-blue hover:bg-rotary-bluePale disabled:opacity-50"
        >
          {carregando ? 'Expandindo…' : 'Expandir'}
        </button>
      </div>
      {mensagem && (
        <p className={`mt-2 text-sm ${mensagem.tipo === 'ok' ? 'text-rotary-green' : 'text-red-600'}`}>
          {mensagem.texto}
        </p>
      )}
    </form>
  );
}
