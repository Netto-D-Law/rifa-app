'use client';

import { useState } from 'react';
import type { Raffle } from '@/lib/types';

interface Props {
  raffle: Raffle;
  action: (formData: FormData) => Promise<{ ok: boolean; erro?: string }>;
}

function Campo({
  label,
  name,
  defaultValue,
  type = 'text',
  textarea = false,
}: {
  label: string;
  name: string;
  defaultValue: string | number;
  type?: string;
  textarea?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-slate-500">{label}</label>
      {textarea ? (
        <textarea
          name={name}
          defaultValue={defaultValue}
          rows={3}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-rotary-blue focus:outline-none"
        />
      ) : (
        <input
          name={name}
          type={type}
          defaultValue={defaultValue}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-rotary-blue focus:outline-none"
        />
      )}
    </div>
  );
}

export default function SalvarConfigForm({ raffle, action }: Props) {
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSalvando(true);
    setMensagem(null);
    const formData = new FormData(e.currentTarget);
    const resp = await action(formData);
    setSalvando(false);
    setMensagem(
      resp.ok
        ? { tipo: 'ok', texto: 'Configurações salvas!' }
        : { tipo: 'erro', texto: resp.erro ?? 'Erro ao salvar.' }
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Campo label="Título" name="titulo" defaultValue={raffle.titulo} />
        </div>
        <div className="col-span-2">
          <Campo label="Descrição" name="descricao" defaultValue={raffle.descricao} textarea />
        </div>
        <Campo
          label="Preço por número (R$)"
          name="preco_por_numero"
          type="number"
          defaultValue={raffle.preco_por_numero}
        />
        <Campo
          label="Data/hora do sorteio"
          name="data_sorteio"
          type="datetime-local"
          defaultValue={raffle.data_sorteio?.slice(0, 16) ?? ''}
        />
        <Campo
          label="Reserva expira em (min)"
          name="reserva_expira_min"
          type="number"
          defaultValue={raffle.reserva_expira_min}
        />
        <Campo label="Chave Pix" name="pix_chave" defaultValue={raffle.pix_chave} />
        <Campo
          label="Nome do recebedor (Pix)"
          name="pix_nome_recebedor"
          defaultValue={raffle.pix_nome_recebedor}
        />
        <Campo label="Cidade (Pix)" name="pix_cidade" defaultValue={raffle.pix_cidade} />
        <div className="col-span-2">
          <Campo
            label="Instruções extras do Pix"
            name="pix_instrucoes"
            defaultValue={raffle.pix_instrucoes}
            textarea
          />
        </div>
        <div className="col-span-2">
          <Campo
            label="Mercado Pago — Access Token (para cobrar no cartão)"
            name="cakto_link"
            defaultValue={raffle.cakto_link}
          />
          <p className="mt-1 text-xs text-slate-400">
            Pegue em mercadopago.com.br → Seu negócio → Credenciais → Access Token de Produção.
            Com isso o sistema gera o valor exato para cada compra.
          </p>
        </div>
      </div>

      {mensagem && (
        <div
          className={`rounded-lg px-3 py-2 text-sm ${
            mensagem.tipo === 'ok' ? 'bg-rotary-greenPale text-rotary-green' : 'bg-red-50 text-red-700'
          }`}
        >
          {mensagem.texto}
        </div>
      )}

      <button
        type="submit"
        disabled={salvando}
        className="rounded-lg bg-rotary-blue px-5 py-2.5 text-sm font-bold text-white hover:bg-rotary-blueDark disabled:opacity-50"
      >
        {salvando ? 'Salvando…' : 'Salvar configurações'}
      </button>
    </form>
  );
}
