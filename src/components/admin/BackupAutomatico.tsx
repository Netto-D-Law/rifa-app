'use client';

import { useEffect } from 'react';
import { gerarEBaixarExcelRifa, type PedidoExport } from '@/lib/gerarExcelRifa';
import type { RaffleNumber } from '@/lib/types';

interface Props {
  numeros: RaffleNumber[];
  pedidos: PedidoExport[];
  totalNumeros: number;
}

// Não renderiza nada visível. Ao montar (ou seja, sempre que o admin abre
// o painel), gera e baixa automaticamente um Excel de backup com os
// números e pedidos atuais — uma vez por sessão do navegador, para não
// disparar um download a cada troca de página dentro do painel.
export default function BackupAutomatico({ numeros, pedidos, totalNumeros }: Props) {
  useEffect(() => {
    const chave = 'rifa_backup_automatico_feito';
    if (sessionStorage.getItem(chave)) return;

    const dataHora = new Date().toISOString().slice(0, 16).replace('T', '-').replace(':', 'h');
    gerarEBaixarExcelRifa(numeros, pedidos, totalNumeros, `backup-rifa-${dataHora}.xlsx`)
      .then(() => sessionStorage.setItem(chave, '1'))
      .catch(() => {
        // Se falhar (ex.: navegador bloqueou o download), não marca como
        // feito — tenta de novo na próxima vez que o admin abrir o painel.
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
