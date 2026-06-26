import { type NextRequest, NextResponse } from 'next/server';

// FUNDAÇÃO para automação futura. Hoje, a confirmação de pagamentos com
// cartão (Cakto) é manual: o admin compara o valor recebido no painel da
// Cakto com os pedidos pendentes e confirma no /admin.
//
// Para automatizar de verdade:
// 1. No painel da Cakto, vá em Integrações > Webhooks e cadastre a URL
//    pública desta rota (ex: https://seusite.vercel.app/api/cakto-webhook)
//    para o evento "Compra aprovada".
// 2. Confira no painel da Cakto qual campo identifica o pedido (referência
//    externa, e-mail do comprador, valor) e ajuste o "TODO" abaixo para
//    casar isso com o pedido correto na tabela `orders` antes de chamar
//    confirmar_pagamento.
// 3. Configure CAKTO_WEBHOOK_SECRET no .env e valide a assinatura/segredo
//    enviado pela Cakto antes de confiar no payload (não implementado
//    aqui por não termos validado o formato exato do seu lado).
export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null);

  if (!payload) {
    return NextResponse.json({ ok: false, erro: 'payload inválido' }, { status: 400 });
  }

  // eslint-disable-next-line no-console
  console.log('[cakto-webhook] evento recebido:', JSON.stringify(payload));

  // TODO: validar payload.secret contra process.env.CAKTO_WEBHOOK_SECRET
  // TODO: localizar o pedido correspondente e chamar supabase.rpc('confirmar_pagamento', ...)
  //       usando um cliente com a Secret key (createAdminClient), já que este
  //       endpoint é chamado pela Cakto e não tem sessão de admin logado.

  return NextResponse.json({ ok: true });
}
