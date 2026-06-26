'use client';

import { useState } from 'react';

interface Props {
  action: (formData: FormData) => Promise<{ ok: boolean; erro?: string }>;
}

export default function ConvidarForm({ action }: Props) {
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnviando(true);
    setMensagem(null);
    const formData = new FormData(e.currentTarget);
    const resp = await action(formData);
    setEnviando(false);
    if (resp.ok) {
      setMensagem({ tipo: 'ok', texto: 'Convite enviado por e-mail!' });
      (e.target as HTMLFormElement).reset();
    } else {
      setMensagem({ tipo: 'erro', texto: resp.erro ?? 'Erro ao convidar.' });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl bg-white p-6 shadow-sm">
      <h2 className="mb-3 text-sm font-bold text-rotary-blueDark">Convidar novo administrador</h2>
      <div className="flex flex-wrap gap-3">
        <input
          name="nome"
          placeholder="Nome"
          required
          className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-rotary-blue focus:outline-none"
        />
        <input
          name="email"
          type="email"
          placeholder="E-mail"
          required
          className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-rotary-blue focus:outline-none"
        />
        <button
          type="submit"
          disabled={enviando}
          className="rounded-lg bg-rotary-gold px-4 py-2 text-sm font-bold text-amber-950 hover:bg-amber-500 disabled:opacity-50"
        >
          {enviando ? 'Enviando…' : 'Convidar'}
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
