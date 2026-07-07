// Gera um arquivo .xlsx com os números e pedidos da rifa, direto no
// navegador (sem precisar de um endpoint no servidor). Usado tanto pelo
// botão manual de exportação quanto pelo backup automático ao abrir o
// painel administrativo.
'use client';

import { padNumero } from './format';
import type { RaffleNumber } from './types';

export interface PedidoExport {
  id: string;
  nome: string;
  clube: string | null;
  whatsapp: string;
  email: string | null;
  metodo_pagamento: string;
  quantidade: number;
  valor_total: number;
  status: string;
  criado_em: string;
  confirmado_em: string | null;
}

export async function gerarEBaixarExcelRifa(
  numeros: RaffleNumber[],
  pedidos: PedidoExport[],
  totalNumeros: number,
  nomeArquivo: string
) {
  const XLSX = await import('xlsx');

  const pedidosPorId = new Map(pedidos.map((p) => [p.id, p]));

  // Aba 1: uma linha por pedido, com os números daquele pedido juntos.
  const numerosPorPedido = new Map<string, number[]>();
  for (const n of numeros) {
    if (!n.pedido_id) continue;
    const lista = numerosPorPedido.get(n.pedido_id) ?? [];
    lista.push(n.numero);
    numerosPorPedido.set(n.pedido_id, lista);
  }

  const abaPedidos = pedidos.map((p) => ({
    'Pedido ID': p.id,
    Comprador: p.nome,
    Clube: p.clube ?? '',
    WhatsApp: p.whatsapp,
    Email: p.email ?? '',
    Pagamento: p.metodo_pagamento === 'cartao' ? 'Cartão (maquininha)' : 'Pix',
    Quantidade: p.quantidade,
    'Valor total (R$)': p.valor_total,
    Status:
      p.status === 'confirmado'
        ? 'Confirmado'
        : p.status === 'pendente'
          ? 'Aguardando confirmação'
          : p.status === 'cancelado'
            ? 'Cancelado'
            : 'Expirado',
    Números: (numerosPorPedido.get(p.id) ?? [])
      .sort((a, b) => a - b)
      .map((n) => padNumero(n, totalNumeros))
      .join(', '),
    'Reservado em': p.criado_em ? new Date(p.criado_em).toLocaleString('pt-BR') : '',
    'Confirmado em': p.confirmado_em ? new Date(p.confirmado_em).toLocaleString('pt-BR') : '',
  }));

  // Aba 2: uma linha por número (útil para conferência rápida).
  const abaNumeros = numeros
    .slice()
    .sort((a, b) => a.numero - b.numero)
    .map((n) => {
      const pedido = n.pedido_id ? pedidosPorId.get(n.pedido_id) : undefined;
      return {
        Número: padNumero(n.numero, totalNumeros),
        Status:
          n.status === 'vendido'
            ? 'Confirmado'
            : n.status === 'reservado'
              ? 'Aguardando confirmação'
              : 'Disponível',
        Comprador: pedido?.nome ?? '',
        Clube: pedido?.clube ?? '',
        WhatsApp: pedido?.whatsapp ?? '',
      };
    });

  // Aba 3: resumo por clube (útil na hora de calcular o repasse da verba).
  const totaisPorClube = new Map<string, { pedidos: number; numeros: number; valorConfirmado: number; valorPendente: number }>();
  for (const p of pedidos) {
    if (p.status !== 'confirmado' && p.status !== 'pendente') continue;
    const chave = p.clube?.trim() || '(sem clube informado)';
    const atual = totaisPorClube.get(chave) ?? { pedidos: 0, numeros: 0, valorConfirmado: 0, valorPendente: 0 };
    atual.pedidos += 1;
    atual.numeros += numerosPorPedido.get(p.id)?.length ?? 0;
    if (p.status === 'confirmado') atual.valorConfirmado += p.valor_total;
    else atual.valorPendente += p.valor_total;
    totaisPorClube.set(chave, atual);
  }
  const abaClubes = Array.from(totaisPorClube.entries())
    .sort((a, b) => b[1].valorConfirmado - a[1].valorConfirmado)
    .map(([clube, t]) => ({
      Clube: clube,
      Pedidos: t.pedidos,
      Números: t.numeros,
      'Valor confirmado (R$)': t.valorConfirmado,
      'Valor aguardando confirmação (R$)': t.valorPendente,
    }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(abaPedidos), 'Pedidos');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(abaNumeros), 'Números');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(abaClubes), 'Por clube');
  XLSX.writeFile(wb, nomeArquivo);
}
