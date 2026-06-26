'use client';

import { useRef, useState } from 'react';
import { padNumero, maskNome } from '@/lib/format';
import type { Raffle } from '@/lib/types';

interface Participante {
  numero: number;
  nome: string;
}

interface Props {
  raffle: Raffle;
  participantes: Participante[];
  onSortear: () => Promise<{ ok: boolean; erro?: string; resultado?: { numero: number; nome: string } }>;
}

const DURACAO_MS = 60000;
const INTERVALO_MS = 90;

export default function DrawStage({ raffle, participantes, onSortear }: Props) {
  const [girando, setGirando] = useState(false);
  const [numeroAtual, setNumeroAtual] = useState<number | null>(raffle.numero_vencedor);
  const [nomeAtual, setNomeAtual] = useState('');
  const [vencedor, setVencedor] = useState(
    raffle.sorteio_realizado && raffle.numero_vencedor
      ? { numero: raffle.numero_vencedor, nome: '' }
      : null
  );
  const [erro, setErro] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function iniciar() {
    if (participantes.length === 0) return;
    setErro('');
    setVencedor(null);
    setGirando(true);

    const inicio = Date.now();
    intervalRef.current = setInterval(() => {
      const p = participantes[Math.floor(Math.random() * participantes.length)];
      setNumeroAtual(p.numero);
      setNomeAtual(p.nome);

      if (Date.now() - inicio > DURACAO_MS) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        finalizar();
      }
    }, INTERVALO_MS);
  }

  async function finalizar() {
    const resp = await onSortear();
    setGirando(false);

    if (!resp.ok) {
      setErro(resp.erro ?? 'Erro ao sortear.');
      return;
    }

    if (resp.resultado) {
      setNumeroAtual(resp.resultado.numero);
      setNomeAtual(resp.resultado.nome);
      setVencedor(resp.resultado);
    }
  }

  return (
    <div>
      <h1 className="font-display mb-1 text-2xl text-rotary-blueDark">Sorteio ao vivo</h1>
      <p className="mb-6 text-sm text-slate-500">
        Projete esta tela durante o evento. {participantes.length} número(s) confirmado(s)
        participando.
      </p>

      {erro && <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</div>}

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rotary-blueDark to-rotary-blue p-12 text-center">
        <div
          className={`font-display text-6xl font-bold text-white md:text-8xl ${
            girando ? 'animate-pulse' : ''
          }`}
        >
          {numeroAtual !== null ? padNumero(numeroAtual, raffle.total_numeros) : '----'}
        </div>
        <div className="mt-3 min-h-[28px] text-lg font-semibold text-rotary-gold">
          {maskNome(nomeAtual)}
        </div>

        {vencedor && (
          <div className="mt-5 inline-block rounded-full bg-rotary-gold px-5 py-2 text-xs font-bold uppercase tracking-wide text-amber-950">
            Número sorteado!
          </div>
        )}
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={iniciar}
          disabled={girando || participantes.length === 0}
          className="rounded-full bg-rotary-gold px-8 py-3 text-sm font-bold text-amber-950 hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {girando ? 'Sorteando…' : vencedor ? 'Sortear novamente' : 'Iniciar sorteio ao vivo (60s)'}
        </button>
      </div>
    </div>
  );
}
