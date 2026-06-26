export type StatusNumero = 'disponivel' | 'reservado' | 'vendido';
export type MetodoPagamento = 'pix' | 'cartao';
export type StatusPedido = 'pendente' | 'confirmado' | 'expirado' | 'cancelado';

export interface Raffle {
  id: string;
  slug: string;
  titulo: string;
  descricao: string;
  imagem_url: string;
  total_numeros: number;
  preco_por_numero: number;
  data_sorteio: string | null;
  pix_chave: string;
  pix_nome_recebedor: string;
  pix_cidade: string;
  pix_instrucoes: string;
  cakto_link: string;
  reserva_expira_min: number;
  sorteio_realizado: boolean;
  numero_vencedor: number | null;
  criado_em: string;
}

export interface RaffleNumber {
  id: number;
  raffle_id: string;
  numero: number;
  status: StatusNumero;
  pedido_id: string | null;
  reservado_em: string | null;
}

export interface Order {
  id: string;
  raffle_id: string;
  nome: string;
  whatsapp: string;
  email: string | null;
  metodo_pagamento: MetodoPagamento;
  quantidade: number;
  valor_total: number;
  status: StatusPedido;
  criado_em: string;
  confirmado_em: string | null;
}

export interface AdminProfile {
  id: string;
  nome: string;
  email: string;
  papel: string;
  ativo: boolean;
  criado_em: string;
}

export interface AdminLog {
  id: number;
  admin_id: string | null;
  admin_nome: string;
  acao: string;
  detalhes: Record<string, unknown>;
  criado_em: string;
}

export interface ReservaResultado {
  pedido_id: string;
  numeros: number[];
  valor_total: number;
}
