'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Raffle, RaffleNumber } from '@/lib/types';
import { formatMoeda, formatDataHora, maskNome, padNumero } from '@/lib/format';
import NumberGrid from './NumberGrid';
import CartBar from './CartBar';
import CheckoutModal from './CheckoutModal';

type Tab = 'premio' | 'todos' | 'disponiveis' | 'vendidos' | 'artista';

export default function RaffleView({
  raffle,
  numerosIniciais,
}: {
  raffle: Raffle;
  numerosIniciais: RaffleNumber[];
}) {
  const [numeros, setNumeros] = useState<RaffleNumber[]>(numerosIniciais);
  const [tab, setTab] = useState<Tab>('premio');
  const [modoCarrinho, setModoCarrinho] = useState<'manual' | 'quantidade'>('quantidade');
  const [quantidade, setQuantidade] = useState(1);
  const [selecionados, setSelecionados] = useState<Set<number>>(new Set());
  const [checkoutAberto, setCheckoutAberto] = useState(false);

  // Mantém a grade sincronizada em tempo real — quando outra pessoa reserva
  // ou um admin confirma/libera um número, todo mundo vê a mudança sem
  // precisar atualizar a página.
  useEffect(() => {
    const supabase = createClient();
    const canal = supabase
      .channel(`raffle-numbers-${raffle.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'raffle_numbers', filter: `raffle_id=eq.${raffle.id}` },
        (payload) => {
          setNumeros((atual) => {
            const novo = payload.new as RaffleNumber;
            return atual.map((n) => (n.numero === novo.numero ? { ...n, ...novo } : n));
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [raffle.id]);

  const contagem = useMemo(() => {
    let disponivel = 0,
      reservado = 0,
      vendido = 0;
    for (const n of numeros) {
      if (n.status === 'disponivel') disponivel++;
      else if (n.status === 'reservado') reservado++;
      else vendido++;
    }
    return { disponivel, reservado, vendido, total: numeros.length };
  }, [numeros]);

  function handleSetModoCarrinho(modo: 'manual' | 'quantidade') {
    // Ao trocar para "quero N números", limpa a seleção manual da grade —
    // isso evita a ambiguidade de ter números marcados na grade que não
    // são, na prática, os que serão comprados.
    if (modo === 'quantidade') setSelecionados(new Set());
    setModoCarrinho(modo);
  }

  function toggleSelecao(numero: number) {
    setSelecionados((atual) => {
      const novo = new Set(atual);
      if (novo.has(numero)) novo.delete(numero);
      else novo.add(numero);
      return novo;
    });
  }

  const pct = contagem.total
    ? Math.round(((contagem.reservado + contagem.vendido) / contagem.total) * 100)
    : 0;

  const tabs: { id: Tab; label: string }[] = [
    { id: 'premio', label: '🏆 Prêmio' },
    { id: 'todos', label: '🔢 Todos os números' },
    { id: 'disponiveis', label: '✅ Disponíveis' },
    { id: 'vendidos', label: '📋 Vendidos' },
    { id: 'artista', label: '🎨 Sobre o artista' },
  ];

  return (
    <main className="min-h-screen pb-24">
      <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-teal-700 via-teal-600 to-rotary-blueDark px-5 py-3 text-white">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/rotary-wheel.jpg"
            alt="Rotary International"
            className="h-8 w-8 rounded-full border border-white/30 bg-white object-contain p-0.5"
          />
          <span className="text-xs font-semibold">Rifa Solidária</span>
        </div>
        <Link
          href="/admin/login"
          className="rounded-full border border-white/40 px-3 py-1 text-xs font-semibold hover:bg-white/10"
        >
          Acesso administrador
        </Link>
      </div>

      {/* Hero / ticket do prêmio — o fundo-site.jpg preenche toda a faixa (pode
          esticar/cortar sem problema) e a marca d'água completa (logo + nome
          do clube) fica intacta e centralizada na coluna esquerda, agora
          maior. Padding vertical reduzido para aproximar as abas do fim
          do card central. */}
      <div
        className="relative overflow-hidden bg-cover bg-center px-5 pb-4 pt-8"
        style={{ backgroundImage: "url('/fundo-site.jpg')" }}
      >
        <div className="mx-auto grid max-w-6xl items-center gap-6 md:grid-cols-[300px_1fr_220px]">
          {/* Coluna esquerda: marca d'água completa, sem distorcer, maior e
              centralizada */}
          <div className="flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/marca-agua-completa.jpg"
              alt="Rotary Club de São Paulo Butantã"
              className="h-auto w-full max-w-[300px] rounded-xl object-contain shadow-xl"
            />
          </div>

          {/* Centro: card branco do prêmio */}
          <div className="grid overflow-hidden rounded-2xl bg-white shadow-xl md:grid-cols-[220px_1fr]">
            <div className="flex min-h-[180px] items-center justify-center bg-rotary-bluePale">
              {raffle.imagem_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={raffle.imagem_url} alt={raffle.titulo} className="h-full w-full object-cover" />
              ) : (
                <span className="text-5xl">🎟️</span>
              )}
            </div>
            <div className="p-6">
              <div className="text-xs font-bold uppercase tracking-wide text-rotary-goldDark">
                Ação social · Rotary Club Butantã
              </div>
              <h1 className="font-display mt-1 text-2xl font-bold text-rotary-blueDark">
                {raffle.titulo}
              </h1>
              <p className="mt-2 max-w-lg text-sm text-slate-500">{raffle.descricao}</p>

              <div className="mt-4 flex flex-wrap gap-6">
                <div>
                  <div className="text-[11px] uppercase text-slate-400">Valor do número</div>
                  <div className="font-semibold">{formatMoeda(raffle.preco_por_numero)}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase text-slate-400">Sorteio</div>
                  <div className="font-semibold">{formatDataHora(raffle.data_sorteio)}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase text-slate-400">Disponíveis</div>
                  <div className="font-semibold">{contagem.disponivel}</div>
                </div>
              </div>

              <div className="mt-4 max-w-sm">
                <div className="h-2.5 overflow-hidden rounded-full bg-rotary-bluePale">
                  <div
                    className="h-full rounded-full bg-rotary-green transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  {contagem.reservado + contagem.vendido} de {contagem.total} números garantidos (
                  {pct}%)
                </div>
              </div>

              {raffle.sorteio_realizado && raffle.numero_vencedor && (
                <div className="mt-4 rounded-lg bg-rotary-greenPale px-4 py-2.5 text-sm font-semibold text-rotary-green">
                  🎉 Número sorteado: {padNumero(raffle.numero_vencedor, raffle.total_numeros)}
                </div>
              )}
            </div>
          </div>

          {/* Coluna direita: teaser do artista, com link para a aba completa */}
          <button
            onClick={() => setTab('artista')}
            className="hidden flex-col items-center justify-center rounded-xl border border-white/20 bg-black/30 p-4 text-center text-white backdrop-blur-sm transition hover:bg-black/40 md:flex"
          >
            <span className="text-xs font-semibold uppercase tracking-wide text-rotary-gold">
              O artista
            </span>
            <span className="mt-1 text-sm font-semibold">OJAS (Odair Silva)</span>
            <span className="mt-2 text-[11px] leading-relaxed text-white/80">
              Pintura autoral em tons de azul, inspirada na cultura nordestina.
            </span>
            <span className="mt-2 text-[11px] font-semibold underline">Ver mais →</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mx-auto mt-3 max-w-4xl px-5">
        <div className="flex gap-1 overflow-x-auto rounded-full bg-white p-1.5 shadow-md">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${
                tab === t.id ? 'bg-rotary-blue text-white' : 'text-slate-500 hover:text-rotary-blue'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="mx-auto max-w-4xl px-5 py-6">
        <div className="rounded-2xl bg-white p-6 shadow-md">
          {tab === 'premio' && (
            <div>
              <h2 className="font-display text-lg text-rotary-blueDark">Sobre esta ação</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{raffle.descricao}</p>
              <ul className="mt-4 space-y-1 text-sm text-slate-500">
                <li>
                  Valor por número: <strong>{formatMoeda(raffle.preco_por_numero)}</strong>
                </li>
                <li>
                  Total de números: <strong>{raffle.total_numeros}</strong>
                </li>
                <li>
                  Data do sorteio: <strong>{formatDataHora(raffle.data_sorteio)}</strong>
                </li>
              </ul>
            </div>
          )}

          {tab === 'todos' && (
            <NumberGrid
              numeros={numeros}
              total={raffle.total_numeros}
              modo="todos"
              selecionados={selecionados}
              onToggle={(numero) => {
                setModoCarrinho('manual');
                toggleSelecao(numero);
              }}
            />
          )}

          {tab === 'disponiveis' && (
            <NumberGrid
              numeros={numeros}
              total={raffle.total_numeros}
              modo="disponiveis"
              selecionados={selecionados}
              onToggle={(numero) => {
                setModoCarrinho('manual');
                toggleSelecao(numero);
              }}
            />
          )}

          {tab === 'vendidos' && (
            <div>
              <h2 className="font-display mb-3 text-lg text-rotary-blueDark">
                Números reservados / vendidos
              </h2>
              <p className="mb-4 text-xs text-slate-400">
                Por privacidade, mostramos apenas o primeiro nome dos compradores.
              </p>
              {numeros.filter((n) => n.status !== 'disponivel').length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">
                  Nenhum número vendido ainda.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400">
                      <th className="py-2">Número</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {numeros
                      .filter((n) => n.status !== 'disponivel')
                      .map((n) => (
                        <tr key={n.numero} className="border-b border-slate-100">
                          <td className="py-2 font-semibold">
                            {padNumero(n.numero, raffle.total_numeros)}
                          </td>
                          <td>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                n.status === 'vendido'
                                  ? 'bg-rotary-bluePale text-rotary-blue'
                                  : 'bg-amber-100 text-amber-700'
                              }`}
                            >
                              {n.status === 'vendido' ? 'Confirmado' : 'Aguardando confirmação'}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {tab === 'artista' && (
            <div>
              <div className="flex flex-col gap-6 md:flex-row md:items-start">
                <div className="shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={raffle.imagem_url || '/rotary-butanta-logo.jpg'}
                    alt="Samurai Azul (Bushido) — OJAS"
                    className="w-full max-w-[220px] rounded-xl object-cover shadow-md"
                  />
                  <div className="mt-2 text-center text-[11px] text-slate-400">
                    &quot;Samurai Azul (Bushido)&quot;, 2022 · acrílica sobre tela · 150x100cm
                  </div>
                </div>

                <div>
                  <div className="text-xs font-bold uppercase tracking-wide text-rotary-goldDark">
                    O artista
                  </div>
                  <h2 className="font-display mt-1 text-xl font-bold text-rotary-blueDark">
                    OJAS (Odair Silva)
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    Artista visual, designer e cenógrafo nascido no Maranhão e radicado em
                    Teresina (PI) desde os 5 anos de idade. Autodidata, constrói seu estilo a
                    partir da mistura entre ilustração editorial, publicidade e design com a
                    influência dos mestres da Renascença, do cubismo geométrico, da pop art e da
                    street art.
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    Sua marca registrada são figuras estilizadas em tons de azul sobre fundos
                    geométricos multicoloridos que remetem às paisagens urbanas do Nordeste,
                    contando histórias do cotidiano e celebrando a diversidade e a musicalidade
                    da cultura nordestina.
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    A obra desta rifa,{' '}
                    <strong className="text-rotary-blueDark">&quot;Samurai Azul (Bushido)&quot;</strong>
                    , foi inspirada nos filmes de samurais do cineasta japonês Akira Kurosawa
                    (Os Sete Samurais, Ran, Kagemusha). A pintura retrata um guerreiro em posição
                    de combate, trajando armadura rica em detalhes e portando a katana — uma
                    homenagem ao Bushidô, o código de honra e moral que guiava os samurais.
                  </p>

                  <div className="mt-4">
                    <div className="text-xs font-bold uppercase tracking-wide text-rotary-goldDark">
                      Reconhecimentos
                    </div>
                    <ul className="mt-2 space-y-1 text-sm text-slate-600">
                      <li>🏆 Luxembourg Art Prize — Pinacothèque, Grão-Ducado de Luxemburgo (2022)</li>
                      <li>
                        🏆 6º Anuário de Artes da Luxus Magazine, São Paulo — único artista do
                        Piauí selecionado (2022)
                      </li>
                      <li>🏆 Exposição Internacional Artistas pela Paz — ArtShout, Londres (2022)</li>
                      <li>🏆 Prêmio Museu da Casa Brasileira — Design, São Paulo (2011)</li>
                      <li>🏆 19º Prêmio Fernando Pini de Excelência Gráfica (2010)</li>
                      <li>🏆 Prêmio profissional do ano TV Clube/Globo (2018)</li>
                    </ul>
                  </div>

                  <div className="mt-4 rounded-xl bg-rotary-bluePale p-4">
                    <div className="text-xs font-bold uppercase tracking-wide text-rotary-blueDark">
                      Em cartaz
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      &quot;A Arte que Toca a Alma: Som, Imagem e Movimento&quot; — exposição
                      individual imersiva com 20 pinturas, instalação de pássaros interativos e
                      telas animadas por IA, na Galeria Dora Parentes (SESC Cajuína, Teresina/PI).
                    </p>
                  </div>

                  <div className="mt-4 text-sm text-slate-500">
                    Contato do artista: ojas.br@gmail.com · +55 86 99422.1117 · @ojas.br
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <CartBar
        precoPorNumero={raffle.preco_por_numero}
        modo={modoCarrinho}
        setModo={handleSetModoCarrinho}
        quantidade={quantidade}
        setQuantidade={setQuantidade}
        qtdSelecionadosManual={selecionados.size}
        onLimparSelecao={() => setSelecionados(new Set())}
        onComprar={() => setCheckoutAberto(true)}
        disponiveis={contagem.disponivel}
      />

      {checkoutAberto && (
        <CheckoutModal
          raffle={raffle}
          numerosManuais={modoCarrinho === 'manual' ? Array.from(selecionados) : []}
          quantidade={quantidade}
          onClose={() => setCheckoutAberto(false)}
          onSucesso={() => {
            setSelecionados(new Set());
            setQuantidade(1);
          }}
        />
      )}

      <footer className="py-6 text-center text-xs text-slate-400">
        Uma ação do Rotary Club Butantã
      </footer>
    </main>
  );
}
