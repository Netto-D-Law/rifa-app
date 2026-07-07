'use server';

import { createClient } from '@/lib/supabase/server';
import type { MetodoPagamento, ReservaResultado } from '@/lib/types';

export interface DadosComprador {
  nome: string;
  clube: string;
  whatsapp: string;
  email: string;
  metodo: MetodoPagamento;
}

export type ResultadoReserva =
  | { ok: true; resultado: ReservaResultado }
  | { ok: false; erro: string };

function traduzirErro(mensagem: string): string {
  if (mensagem.includes('numeros_indisponiveis')) {
    return 'Um ou mais números escolhidos acabaram de ser reservados por outra pessoa. Atualize a página e escolha outros números.';
  }
  if (mensagem.includes('numeros_insuficientes_disponiveis')) {
    return 'Não há números suficientes disponíveis para essa quantidade agora. Tente um número menor.';
  }
  if (mensagem.includes('rifa_nao_encontrada')) {
    return 'Rifa não encontrada. Atualize a página.';
  }
  return 'Não foi possível concluir a reserva. Tente novamente em alguns segundos.';
}

// Reserva números ESPECÍFICOS escolhidos pelo comprador na grade.
export async function reservarNumerosAction(
  raffleId: string,
  numeros: number[],
  dados: DadosComprador
): Promise<ResultadoReserva> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('reservar_numeros', {
    p_raffle_id: raffleId,
    p_numeros: numeros,
    p_nome: dados.nome,
    p_whatsapp: dados.whatsapp,
    p_email: dados.email || null,
    p_metodo: dados.metodo,
    p_clube: dados.clube || null,
  });

  if (error) {
    return { ok: false, erro: traduzirErro(error.message) };
  }

  return { ok: true, resultado: data as ReservaResultado };
}

// Reserva uma QUANTIDADE de números, escolhidos aleatoriamente pelo banco
// (FOR UPDATE SKIP LOCKED — seguro mesmo com muitos compradores simultâneos).
export async function reservarAleatoriosAction(
  raffleId: string,
  quantidade: number,
  dados: DadosComprador
): Promise<ResultadoReserva> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('reservar_numeros_aleatorios', {
    p_raffle_id: raffleId,
    p_quantidade: quantidade,
    p_nome: dados.nome,
    p_whatsapp: dados.whatsapp,
    p_email: dados.email || null,
    p_metodo: dados.metodo,
    p_clube: dados.clube || null,
  });

  if (error) {
    return { ok: false, erro: traduzirErro(error.message) };
  }

  return { ok: true, resultado: data as ReservaResultado };
}
