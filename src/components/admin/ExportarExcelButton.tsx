'use client';

import { useState } from 'react';
import { gerarEBaixarExcelRifa, type PedidoExport } from '@/lib/gerarExcelRifa';
import type { RaffleNumber } from '@/lib/types';

interface Props {
  numeros: RaffleNumber[];
  pedidos: PedidoExport[];
  totalNumeros: number;
}

export default function ExportarExcelButton({ numeros, pedidos, totalNumeros }: Props) {
  const [carregando, setCarregando] = useState(false);

  async function handleClick() {
    setCarregando(true);
    try {
      const dataHora = new Date().toISOString().slice(0, 16).replace('T', '-').replace(':', 'h');
      await gerarEBaixarExcelRifa(numeros, pedidos, totalNumeros, `rifa-numeros-pedidos-${dataHora}.xlsx`);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={carregando}
      className="rounded-full border border-rotary-blue px-4 py-1.5 text-xs font-semibold text-rotary-blue hover:bg-rotary-bluePale disabled:opacity-50"
    >
      {carregando ? 'Gerando…' : '📊 Exportar Excel'}
    </button>
  );
}
