'use client';

import { useState } from 'react';
import { gerarEBaixarBackupGeral } from '@/lib/gerarBackupGeral';

export default function BackupGeralButton() {
  const [carregando, setCarregando] = useState(false);

  async function handleClick() {
    setCarregando(true);
    try {
      const dataHora = new Date().toISOString().slice(0, 16).replace('T', '-').replace(':', 'h');
      await gerarEBaixarBackupGeral(`backup-geral-rifa-${dataHora}.xlsx`);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="rounded-xl border border-rotary-blue/30 bg-rotary-bluePale/40 p-6 shadow-sm">
      <h2 className="mb-1 text-sm font-bold text-rotary-blueDark">Backup geral</h2>
      <p className="mb-3 text-xs text-slate-500">
        Baixa um Excel com uma cópia completa de tudo: configurações da rifa, todos os pedidos
        (de qualquer status), todos os números e a equipe de administradores. Use isso
        periodicamente e guarde o arquivo em um lugar seguro fora do Supabase, caso algo dê
        errado.
      </p>
      <button
        onClick={handleClick}
        disabled={carregando}
        className="rounded-lg bg-rotary-blue px-4 py-2 text-sm font-bold text-white hover:bg-rotary-blueDark disabled:opacity-50"
      >
        {carregando ? 'Gerando backup…' : '🗄️ Baixar backup geral'}
      </button>
    </div>
  );
}
