# Rifa Solidária — Rotary Club Butantã

App completo de rifa: grade de números, carrinho com seleção múltipla ou
quantidade aleatória, QR code Pix gerado automaticamente, integração com
Cakto para cartão, painel administrativo com múltiplos administradores,
log de auditoria e sorteio ao vivo.

## Stack

- **Next.js 14** (App Router) — hospedado gratuitamente na **Vercel**
- **Supabase** (Postgres + Auth + Storage) — plano gratuito
- Sem servidor próprio para manter: tudo roda nesses dois serviços free tier

## 1. Banco de dados (Supabase)

Seu projeto **Rotary Sorteios** já está criado e com o schema aplicado
(`sql/001_schema.sql`, `sql/002_patch_seguranca.sql` e
`sql/patch_003_admin_profiles_rls.sql` já foram executados). Se for criar
um projeto novo do zero, rode os três arquivos da pasta `sql/` **nessa
ordem**, no SQL Editor do Supabase.

## 2. Variáveis de ambiente

Copie `.env.local.example` para `.env.local` e preencha:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...        # Settings > API Keys > Secret keys — NUNCA exponha no frontend
NEXT_PUBLIC_RAFFLE_SLUG=rotary-butanta-2026
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## 3. Rodar localmente

```bash
npm install
npm run dev
```

Site público: http://localhost:3000
Painel admin: http://localhost:3000/admin/login

### Criar o primeiro administrador

Como ainda não existe nenhum admin, crie o primeiro direto no Supabase:

1. Authentication > Users > Add user (e-mail + senha, marque "Auto Confirm")
2. Table Editor > `admin_profiles` > Insert row: `id` = o UUID do usuário
   criado, `nome`, `email`, `ativo` = true
3. A partir daí, use a tela **Equipe** dentro do painel para convidar os
   próximos administradores por e-mail — eles recebem o link e cadastram
   a própria senha.

## 4. Publicar gratuitamente (Vercel)

1. Crie um repositório no GitHub e suba esta pasta
2. Em vercel.com, "Add New Project" → importe o repositório
3. Em "Environment Variables", cole as mesmas variáveis do `.env.local`
   (troque `NEXT_PUBLIC_SITE_URL` pela URL que a Vercel vai te dar, ex:
   `https://sua-rifa.vercel.app`)
4. Deploy. Pronto — site no ar, gratuito.
5. Depois do primeiro deploy, atualize `NEXT_PUBLIC_SITE_URL` com a URL
   real e nos Settings do projeto Supabase (Authentication > URL
   Configuration), adicione essa URL em "Redirect URLs" — sem isso, o
   link de convite de administrador não funciona em produção.

## 5. Pagamento com cartão (Cakto)

Hoje a confirmação é manual nos dois métodos de pagamento:

1. Crie um produto na Cakto com o preço do número e copie o link de
   checkout para o campo "Link de checkout Cakto" em Configurações
2. O comprador reserva aqui, é redirecionado para pagar na Cakto
3. Você confere no painel da Cakto e confirma o pedido em `/admin`

A automação completa (webhook confirmando sozinho) tem uma fundação em
`src/app/api/cakto-webhook/route.ts` — leia os comentários no arquivo
para o próximo passo quando quiser ativar isso.

## 6. Sobre a segurança das reservas

Cada reserva passa pelas funções `reservar_numeros` /
`reservar_numeros_aleatorios` no Postgres, que usam transação + (no caso
aleatório) `FOR UPDATE SKIP LOCKED`. Isso garante, no nível do banco, que
dois compradores nunca conseguem garantir o mesmo número — mesmo sob
acesso simultâneo intenso. Veja `sql/001_schema.sql` para os detalhes.

## Estrutura de pastas

```
src/
  lib/              Supabase clients, gerador de QR Pix, tipos
  app/              rotas (site público + painel admin)
  components/       componentes React (público e admin)
sql/                schema e patches do banco, em ordem
```
