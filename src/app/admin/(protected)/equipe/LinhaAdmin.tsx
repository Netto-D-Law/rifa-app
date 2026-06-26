'use client';

import { useState } from 'react';
import { formatDataHora } from '@/lib/format';
import type { AdminProfile } from '@/lib/types';

interface Props {
  admin: AdminProfile;
  souEu: boolean;
  onDesativar: (id: string) => Promise<{ ok: boolean; erro?: string }>;
  onReativar: (id: string) => Promise<{ ok: boolean; erro?: string }>;
}

export default function LinhaAdmin({ admin, souEu, onDesativar, onReativar }: Props) {
  const [carregando, setCarregando] = useState(false);

  async function alternar() {
    setCarregando(true);
    if (admin.ativo) await onDesativar(admin.id);
    else await onReativar(admin.id);
    setCarregando(false);
  }

  return (
    <tr className="border-t border-slate-100">
      <td className="px-4 py-2.5 font-semibold">
        {admin.nome} {souEu && <span className="text-xs text-slate-400">(você)</span>}
      </td>
      <td className="px-4 py-2.5">{admin.email}</td>
      <td className="px-4 py-2.5">
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            admin.ativo ? 'bg-rotary-greenPale text-rotary-green' : 'bg-slate-100 text-slate-500'
          }`}
        >
          {admin.ativo ? 'Ativo' : 'Desativado'}
        </span>
      </td>
      <td className="px-4 py-2.5 text-slate-400">{formatDataHora(admin.criado_em)}</td>
      <td className="px-4 py-2.5">
        {!souEu && (
          <button
            onClick={alternar}
            disabled={carregando}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-50 disabled:opacity-50"
          >
            {admin.ativo ? 'Desativar' : 'Reativar'}
          </button>
        )}
      </td>
    </tr>
  );
}
