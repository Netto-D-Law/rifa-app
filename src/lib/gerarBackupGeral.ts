// Backup geral: exporta TODAS as tabelas relevantes do banco (config da
// rifa, todos os pedidos, todos os números, equipe de admins) em um único
// Excel. Diferente do backup/exportação rápida (que foca em pedidos e
// números da rifa ativa), este é pensado como uma cópia de segurança
// completa — útil para reconstruir a rifa do zero se algo der muito
// errado, ou para levar para fora do Supabase.
'use client';

import { createClient } from './supabase/client';

export async function gerarEBaixarBackupGeral(nomeArquivo: string) {
  const supabase = createClient();
  const XLSX = await import('xlsx');

  const [{ data: raffles }, { data: orders }, { data: numeros }, { data: admins }] = await Promise.all([
    supabase.from('raffles').select('*'),
    supabase.from('orders').select('*').order('criado_em', { ascending: false }),
    supabase.from('raffle_numbers').select('*').order('numero', { ascending: true }),
    supabase.from('admin_profiles').select('*'),
  ]);

  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      (raffles ?? []).map((r) => ({
        ID: r.id,
        Slug: r.slug,
        Título: r.titulo,
        Descrição: r.descricao,
        'Total de números': r.total_numeros,
        'Preço por número (R$)': r.preco_por_numero,
        'Data do sorteio': r.data_sorteio ?? '',
        'Chave Pix': r.pix_chave,
        'Nome recebedor Pix': r.pix_nome_recebedor,
        'Cidade Pix': r.pix_cidade,
        'Sorteio realizado': r.sorteio_realizado ? 'Sim' : 'Não',
        'Número vencedor': r.numero_vencedor ?? '',
        'Criado em': r.criado_em ? new Date(r.criado_em).toLocaleString('pt-BR') : '',
      }))
    ),
    'Config. da rifa'
  );

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      (orders ?? []).map((o) => ({
        ID: o.id,
        'Rifa ID': o.raffle_id,
        Comprador: o.nome,
        Clube: o.clube ?? '',
        WhatsApp: o.whatsapp,
        Email: o.email ?? '',
        Pagamento: o.metodo_pagamento,
        Quantidade: o.quantidade,
        'Valor total (R$)': o.valor_total,
        Status: o.status,
        'Números atribuídos': (o.numeros_atribuidos ?? []).join(', '),
        'Criado em': o.criado_em ? new Date(o.criado_em).toLocaleString('pt-BR') : '',
        'Confirmado em': o.confirmado_em ? new Date(o.confirmado_em).toLocaleString('pt-BR') : '',
      }))
    ),
    'Todos os pedidos'
  );

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      (numeros ?? []).map((n) => ({
        'Rifa ID': n.raffle_id,
        Número: n.numero,
        Status: n.status,
        'Pedido ID': n.pedido_id ?? '',
        'Reservado em': n.reservado_em ? new Date(n.reservado_em).toLocaleString('pt-BR') : '',
      }))
    ),
    'Todos os números'
  );

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      (admins ?? []).map((a) => ({
        Nome: a.nome,
        Email: a.email,
        Papel: a.papel,
        Ativo: a.ativo ? 'Sim' : 'Não',
        'Criado em': a.criado_em ? new Date(a.criado_em).toLocaleString('pt-BR') : '',
      }))
    ),
    'Equipe admin'
  );

  XLSX.writeFile(wb, nomeArquivo);
}
