import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Cria uma preferência de pagamento no Mercado Pago com o valor exato do pedido.
// Devolve { checkoutUrl } que o frontend usa para redirecionar o comprador.
export async function POST(request: NextRequest) {
  const { pedidoId, raffleSlug } = await request.json();

  if (!pedidoId || !raffleSlug) {
    return NextResponse.json({ error: 'pedidoId e raffleSlug obrigatórios' }, { status: 400 });
  }

  const supabase = await createClient();

  // Busca dados do pedido e da rifa
  const { data: pedido } = await supabase
    .from('orders')
    .select('id, nome, email, valor_total, quantidade')
    .eq('id', pedidoId)
    .single();

  if (!pedido) {
    return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
  }

  const { data: raffle } = await supabase
    .from('raffles')
    .select('titulo, cakto_link') // cakto_link agora armazena o MP Access Token
    .eq('slug', raffleSlug)
    .single();

  if (!raffle?.cakto_link) {
    return NextResponse.json({ error: 'Access Token do Mercado Pago não configurado' }, { status: 400 });
  }

  const accessToken = raffle.cakto_link.trim();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;

  // Cria preferência via API do Mercado Pago
  const preference = {
    external_reference: pedidoId,
    items: [
      {
        id: pedidoId,
        title: `${raffle.titulo} — ${pedido.quantidade} número(s)`,
        unit_price: pedido.valor_total,
        quantity: 1,
        currency_id: 'BRL',
      },
    ],
    payer: {
      name: pedido.nome,
      email: pedido.email ?? undefined,
    },
    back_urls: {
      success: `${siteUrl}/?pagamento=aprovado`,
      failure: `${siteUrl}/?pagamento=recusado`,
      pending: `${siteUrl}/?pagamento=pendente`,
    },
    auto_return: 'approved',
    notification_url: `${siteUrl}/api/mp-webhook`,
    statement_descriptor: 'ROTARY RIFA',
  };

  const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(preference),
  });

  if (!mpResponse.ok) {
    const err = await mpResponse.json().catch(() => ({}));
    return NextResponse.json(
      { error: 'Mercado Pago recusou a requisição', detalhe: err },
      { status: 500 }
    );
  }

  const data = await mpResponse.json();

  // init_point = URL de checkout real (sandbox: sandbox_init_point)
  const checkoutUrl: string = data.init_point ?? data.sandbox_init_point;

  return NextResponse.json({ checkoutUrl });
}
