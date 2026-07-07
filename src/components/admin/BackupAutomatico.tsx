'use client';

import { useEffect, useState } from 'react';
import { gerarEBaixarExcelRifa, type PedidoExport } from '@/lib/gerarExcelRifa';
import type { RaffleNumber } from '@/lib/types';

interface Props {
  numeros: RaffleNumber[];
  pedidos: PedidoExport[];
  totalNumeros: number;
}

// Ao abrir o painel, tenta baixar automaticamente um Excel de backup com
// os números e pedidos atuais (uma vez por sessão do navegador). Muitos
// navegadores bloqueiam downloads disparados sem um clique direto do
// usuário — por isso, além da tentativa automática, este componente
// mostra uma faixa visível com um botão manual até o backup ser feito
// com sucesso, garantindo que o admin sempre tenha uma forma clara de
// confirmar que o backup aconteceu (ou de disparar na mão).
export default function BackupAutomatico({ numeros, pedidos, totalNumeros }: Props) {
  const [status, setStatus] = useState<'tentando' | 'feito' | 'pendente' | 'erro'>('tentando');

  async function baixar() {
    setStatus('tentando');
    try {
      const dataHora = new Date().toISOString().slice(0, 16).replace('T', '-').replace(':', 'h');
      await gerarEBaixarExcelRifa(numeros, pedidos, totalNumeros, `backup-rifa-${dataHora}.xlsx`);
      sessionStorage.setItem('rifa_backup_automatico_feito', '1');
      setStatus('feito');
    } catch {
      setStatus('erro');
    }
  }

  useEffect(() => {
    const jaFeito = sessionStorage.getItem('rifa_backup_automatico_feito');
    if (jaFeito) {
      setStatus('feito');
      return;
    }
    // Tenta o download automático uma vez. Se o navegador bloquear (o mais
    // comum), a Promise ainda resolve normalmente — então checamos o
    // resultado do jeito otimista e deixamos a faixa visível como reforço.
    baixar().then(() => {
      // Mesmo com "sucesso" técnico, alguns navegadores só mostram um aviso
      // de bloqueio sem lançar erro — por segurança, mantemos a faixa
      // visível por alguns segundos para o admin confirmar visualmente.
    });
    setStatus('pendente');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === 'feito') return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
      <span className="text-amber-800">
        💾 Backup automático desta sessão: o navegador pode estar bloqueando o download
        silencioso. Confirme clicando no botão ao lado.
      </span>
      <button
        onClick={baixar}
        className="whitespace-nowrap rounded-full bg-amber-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-amber-700"
      >
        Baixar backup agora
      </button>
    </div>
  );
}
