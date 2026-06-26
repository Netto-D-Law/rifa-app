import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Recebe notificações do Mercado Pago.
// Quando o pagamento é aprovado, confirma automaticamente o pedido no banco.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ ok: true });

  // O MP envia type="payment" com id do pagamento
  if (body.type !== 'payment' || !body.data?.id) {
    return NextResponse.json({ ok: true });
  }

  // Busca detalhes do pagamento para verificar se foi aprovado
  // Precisa de qualquer Access Token de produção cadastrado em qualquer rifa ativa
  const supabase = createAdminClient();
  const { data: raffle } = await supabase
    .from('raffles')
    .select('cakto_link')
    .not('cakto_link', 'eq', '')
    .limit(1)
    .single();

  if (!raffle?.cakto_link) {
    return NextResponse.json({ ok: false, error: 'token não configurado' }, { status: 500 });
  }

  const mpResp = await fetch(
    `https://api.mercadopago.com/v1/payments/${body.data.id}`,
    {
      headers: { Authorization: `Bearer ${raffle.cakto_link.trim()}` },
    }
  );

  if (!mpResp.ok) return NextResponse.json({ ok: true });

  const payment = await mpResp.json();

  if (payment.status === 'approved' && payment.external_reference) {
    // Confirma o pedido automaticamente usando a função atômica do banco
    await supabase.rpc('confirmar_pagamento_automatico', {
      p_pedido_id: payment.external_reference,
    });
  }

  return NextResponse.json({ ok: true });
}
