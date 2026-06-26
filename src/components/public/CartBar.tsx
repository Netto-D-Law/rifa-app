'use client';

import { formatMoeda } from '@/lib/format';

interface Props {
  precoPorNumero: number;
  modo: 'manual' | 'quantidade';
  setModo: (m: 'manual' | 'quantidade') => void;
  quantidade: number;
  setQuantidade: (q: number) => void;
  qtdSelecionadosManual: number;
  onLimparSelecao: () => void;
  onComprar: () => void;
  disponiveis: number;
}

export default function CartBar({
  precoPorNumero,
  modo,
  setModo,
  quantidade,
  setQuantidade,
  qtdSelecionadosManual,
  onLimparSelecao,
  onComprar,
  disponiveis,
}: Props) {
  const qtdEfetiva = modo === 'manual' ? qtdSelecionadosManual : quantidade;
  const total = qtdEfetiva * precoPorNumero;
  const podeComprar = qtdEfetiva > 0 && qtdEfetiva <= disponiveis;

  return (
    <div className="sticky bottom-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-4 px-4 py-3">
        <div className="flex rounded-full bg-slate-100 p-1 text-xs font-semibold">
          <button
            onClick={() => setModo('quantidade')}
            className={`rounded-full px-3 py-1.5 ${
              modo === 'quantidade' ? 'bg-rotary-blue text-white' : 'text-slate-500'
            }`}
          >
            Quero N números
          </button>
          <button
            onClick={() => setModo('manual')}
            className={`rounded-full px-3 py-1.5 ${
              modo === 'manual' ? 'bg-rotary-blue text-white' : 'text-slate-500'
            }`}
          >
            Escolher na grade
          </button>
        </div>

        {modo === 'quantidade' ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setQuantidade(Math.max(1, quantidade - 1))}
              className="h-8 w-8 rounded-full border border-slate-300 text-lg font-bold text-slate-600 hover:bg-slate-50"
            >
              −
            </button>
            <input
              type="number"
              min={1}
              max={disponiveis}
              value={quantidade}
              onChange={(e) => setQuantidade(Math.max(1, Number(e.target.value) || 1))}
              className="w-16 rounded-md border border-slate-200 px-2 py-1.5 text-center text-sm"
            />
            <button
              onClick={() => setQuantidade(Math.min(disponiveis, quantidade + 1))}
              className="h-8 w-8 rounded-full border border-slate-300 text-lg font-bold text-slate-600 hover:bg-slate-50"
            >
              +
            </button>
            <span className="text-xs text-slate-400">números aleatórios</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span className="font-semibold">{qtdSelecionadosManual}</span> número(s)
            selecionado(s) na grade
            {qtdSelecionadosManual > 0 && (
              <button onClick={onLimparSelecao} className="text-xs text-rotary-blue underline">
                limpar
              </button>
            )}
          </div>
        )}

        <div className="ml-auto flex items-center gap-4">
          <div className="text-right">
            <div className="text-[11px] uppercase tracking-wide text-slate-400">Total</div>
            <div className="font-display text-lg font-semibold text-rotary-blueDark">
              {formatMoeda(total)}
            </div>
          </div>
          <button
            onClick={onComprar}
            disabled={!podeComprar}
            className="rounded-full bg-rotary-gold px-6 py-2.5 text-sm font-bold text-amber-950 transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Comprar
          </button>
        </div>
      </div>
    </div>
  );
}
