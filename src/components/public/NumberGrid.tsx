'use client';

import { useMemo, useState } from 'react';
import type { RaffleNumber } from '@/lib/types';
import { padNumero } from '@/lib/format';

interface Props {
  numeros: RaffleNumber[];
  total: number;
  modo: 'todos' | 'disponiveis';
  selecionados: Set<number>;
  onToggle: (numero: number) => void;
}

export default function NumberGrid({ numeros, total, modo, selecionados, onToggle }: Props) {
  const [filtro, setFiltro] = useState('');

  const lista = useMemo(() => {
    return numeros.filter((n) => {
      if (modo === 'disponiveis' && n.status !== 'disponivel') return false;
      if (filtro) {
        const numStr = padNumero(n.numero, total);
        if (!numStr.includes(filtro.trim())) return false;
      }
      return true;
    });
  }, [numeros, modo, filtro, total]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          placeholder="Buscar número…"
          className="w-44 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-rotary-blue focus:outline-none"
        />
        <div className="flex gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <i className="inline-block h-2.5 w-2.5 rounded-sm bg-rotary-green" /> Disponível
          </span>
          <span className="flex items-center gap-1.5">
            <i className="inline-block h-2.5 w-2.5 rounded-sm bg-rotary-gold" /> Reservado
          </span>
          <span className="flex items-center gap-1.5">
            <i className="inline-block h-2.5 w-2.5 rounded-sm bg-rotary-blue" /> Confirmado
          </span>
        </div>
      </div>

      {lista.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-400">Nenhum número encontrado.</p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(58px,1fr))] gap-1.5">
          {lista.map((n) => {
            const isSelected = selecionados.has(n.numero);
            const base = 'rounded-md py-2 text-center text-sm font-bold transition-transform';
            let cor = 'bg-rotary-green text-white hover:-translate-y-0.5';
            if (n.status === 'reservado') cor = 'bg-rotary-gold text-amber-950';
            if (n.status === 'vendido') cor = 'bg-rotary-blue text-white';

            return (
              <button
                key={n.numero}
                disabled={n.status !== 'disponivel'}
                onClick={() => onToggle(n.numero)}
                title={
                  n.status === 'disponivel'
                    ? 'Disponível — toque para selecionar'
                    : n.status === 'reservado'
                      ? 'Reservado, aguardando confirmação'
                      : 'Confirmado'
                }
                className={`${base} ${cor} ${
                  isSelected ? 'ring-4 ring-offset-2 ring-rotary-blueDark scale-105' : ''
                } ${n.status !== 'disponivel' ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'}`}
              >
                {padNumero(n.numero, total)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
