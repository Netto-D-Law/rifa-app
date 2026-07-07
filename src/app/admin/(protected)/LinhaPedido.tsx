'use client';

import { useState } from 'react';
import { formatMoeda, formatDataHora, padNumero } from '@/lib/format';
import type { Order } from '@/lib/types';

interface Props {
  pedido: Order;
  numeros: number[];
  totalNumeros: number;
  onConfirmar: (pedidoId: string) => Promise<{ ok: boolean; erro?: string }>;
  onLiberar: (pedidoId: string) => Promise<{ ok: boolean; erro?: string }>;
}

export default function LinhaPedido({ pedido, numeros, totalNumeros, onConfirmar, onLiberar }: Props) {
  const [carregando, setCarregando] = useState<'confirmar' | 'liberar' | null>(null);
  const [erro, setErro] = useState('');

  // Prioriza o registro permanente (numeros_atribuidos) sobre o vínculo
  // ao vivo em raffle_numbers, que é apagado assim que o pedido é
  // liberado/cancelado — assim o número sorteado nunca some da tela.
  const numerosExibidos =
    pedido.numeros_atribuidos && pedido.numeros_atribuidos.length > 0
      ? pedido.numeros_atribuidos
      : numeros;

  async function executar(acao: 'confirmar' | 'liberar') {
    setCarregando(acao);
    setErro('');
    const resp = acao === 'confirmar' ? await onConfirmar(pedido.id) : await onLiberar(pedido.id);
    setCarregando(null);
    if (!resp.ok) setErro(resp.erro ?? 'Erro ao processar.');
  }

  return (
    <tr className="border-t border-slate-100">
      <td className="px-4 py-2.5 font-semibold">
        {numerosExibidos.map((n) => padNumero(n, totalNumeros)).join(', ')}
      </td>
      <td className="px-4 py-2.5">{pedido.nome}</td>
      <td className="px-4 py-2.5">{pedido.whatsapp}</td>
      <td className="px-4 py-2.5">{pedido.metodo_pagamento === 'pix' ? 'Pix' : 'Cartão'}</td>
      <td className="px-4 py-2.5">{formatMoeda(pedido.valor_total)}</td>
      <td className="px-4 py-2.5 text-slate-400">{formatDataHora(pedido.criado_em)}</td>
      <td className="whitespace-nowrap px-4 py-2.5">
        <div className="flex gap-2">
          <button
            onClick={() => executar('confirmar')}
            disabled={carregando !== null}
            className="rounded-full bg-rotary-blue px-3 py-1 text-xs font-semibold text-white hover:bg-rotary-blueDark disabled:opacity-50"
          >
            {carregando === 'confirmar' ? '...' : 'Confirmar'}
          </button>
          <button
            onClick={() => executar('liberar')}
            disabled={carregando !== null}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-50 disabled:opacity-50"
          >
            {carregando === 'liberar' ? '...' : 'Liberar'}
          </button>
        </div>
        {erro && <p className="mt-1 text-xs text-red-600">{erro}</p>}
      </td>
    </tr>
  );
}
