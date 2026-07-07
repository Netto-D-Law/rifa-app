'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function confirmarPagamentoAction(pedidoId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc('confirmar_pagamento', { p_pedido_id: pedidoId });
  revalidatePath('/admin');
  revalidatePath('/');
  if (error) return { ok: false, erro: error.message };
  return { ok: true };
}

export async function liberarPedidoAction(pedidoId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc('liberar_pedido', { p_pedido_id: pedidoId });
  revalidatePath('/admin');
  revalidatePath('/');
  if (error) return { ok: false, erro: error.message };
  return { ok: true };
}

export async function sortearVencedorAction(raffleId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('sortear_vencedor', { p_raffle_id: raffleId });
  revalidatePath('/admin/sorteio');
  revalidatePath('/');
  if (error) return { ok: false, erro: error.message };
  return { ok: true, resultado: data as { numero: number; nome: string } };
}

// Limpa o resultado do sorteio (sorteio_realizado / numero_vencedor) sem
// mexer nos números da rifa — útil depois de um sorteio de teste, ou
// depois de resetar a rifa (o reset da rifa libera os números mas não
// apaga o vencedor gravado, já que são coisas independentes no banco).
export async function limparSorteioAction(raffleId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('raffles')
    .update({ sorteio_realizado: false, numero_vencedor: null })
    .eq('id', raffleId);
  revalidatePath('/admin/sorteio');
  revalidatePath('/admin');
  revalidatePath('/');
  if (error) return { ok: false, erro: error.message };
  return { ok: true };
}

export async function liberarExpiradosAction(raffleId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('liberar_expirados', { p_raffle_id: raffleId });
  revalidatePath('/admin');
  revalidatePath('/');
  if (error) return { ok: false, erro: error.message };
  return { ok: true, quantidade: data as number };
}

export async function atualizarConfigAction(raffleId: string, formData: FormData) {
  const supabase = await createClient();

  const patch = {
    titulo: String(formData.get('titulo') ?? ''),
    descricao: String(formData.get('descricao') ?? ''),
    // imagem_url é gerenciada separadamente via atualizarImagemAction — não incluir aqui
    preco_por_numero: Number(formData.get('preco_por_numero') ?? 0),
    data_sorteio: String(formData.get('data_sorteio') ?? '') || null,
    pix_chave: String(formData.get('pix_chave') ?? ''),
    pix_nome_recebedor: String(formData.get('pix_nome_recebedor') ?? ''),
    pix_cidade: String(formData.get('pix_cidade') ?? ''),
    pix_instrucoes: String(formData.get('pix_instrucoes') ?? ''),
    cakto_link: String(formData.get('cakto_link') ?? ''),
    reserva_expira_min: Number(formData.get('reserva_expira_min') ?? 30),
  };

  const { error } = await supabase.from('raffles').update(patch).eq('id', raffleId);

  revalidatePath('/admin/configuracoes');
  revalidatePath('/');

  if (error) return { ok: false, erro: error.message };
  return { ok: true };
}

export async function atualizarImagemAction(raffleId: string, novaUrl: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('raffles').update({ imagem_url: novaUrl }).eq('id', raffleId);
  revalidatePath('/admin/configuracoes');
  revalidatePath('/');
  if (error) return { ok: false, erro: error.message };
  return { ok: true };
}

export async function expandirNumerosAction(raffleId: string, novoTotal: number) {
  const supabase = await createClient();
  const { error: errUpdate } = await supabase
    .from('raffles')
    .update({ total_numeros: novoTotal })
    .eq('id', raffleId);
  if (errUpdate) return { ok: false, erro: errUpdate.message };

  const { error: errInit } = await supabase.rpc('inicializar_numeros', { p_raffle_id: raffleId });
  revalidatePath('/');
  revalidatePath('/admin');
  if (errInit) return { ok: false, erro: errInit.message };
  return { ok: true };
}

// Reseta a rifa inteira: libera TODOS os números reservados/vendidos,
// devolvendo-os para "disponível" e cancelando os pedidos associados.
export async function resetarRifaAction(raffleId: string) {
  const supabase = await createClient();

  const { data: pedidos, error: errBusca } = await supabase
    .from('orders')
    .select('id')
    .eq('raffle_id', raffleId)
    .in('status', ['pendente', 'confirmado']);

  if (errBusca) return { ok: false, erro: errBusca.message };

  let liberados = 0;
  const erros: string[] = [];

  for (const pedido of pedidos ?? []) {
    const { error } = await supabase.rpc('liberar_pedido', { p_pedido_id: pedido.id });
    if (error) {
      erros.push(error.message);
    } else {
      liberados++;
    }
  }

  revalidatePath('/admin');
  revalidatePath('/admin/configuracoes');
  revalidatePath('/');

  if (erros.length > 0) {
    return { ok: false, erro: `Liberados ${liberados} de ${pedidos?.length ?? 0} pedidos. Erros: ${erros.join('; ')}` };
  }
  return { ok: true, quantidade: liberados };
}

export async function convidarAdminAction(formData: FormData) {
  const nome = String(formData.get('nome') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();

  if (!nome || !email) {
    return { ok: false, erro: 'Informe nome e e-mail.' };
  }

  const adminClient = createAdminClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;

  const { error } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: { nome },
    redirectTo: `${siteUrl}/auth/callback?next=/admin/set-password`,
  });

  revalidatePath('/admin/equipe');

  if (error) return { ok: false, erro: error.message };
  return { ok: true };
}

export async function desativarAdminAction(adminId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('admin_profiles').update({ ativo: false }).eq('id', adminId);
  revalidatePath('/admin/equipe');
  if (error) return { ok: false, erro: error.message };
  return { ok: true };
}

export async function reativarAdminAction(adminId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('admin_profiles').update({ ativo: true }).eq('id', adminId);
  revalidatePath('/admin/equipe');
  if (error) return { ok: false, erro: error.message };
  return { ok: true };
}
