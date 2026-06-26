-- ============================================================
-- RIFA ROTARY CLUB BUTANTÃ — SCHEMA SUPABASE (POSTGRES)
-- ============================================================
-- Cole este arquivo inteiro no SQL Editor do seu projeto Supabase
-- (gratuito) e clique em "Run". Ele cria as tabelas, os índices,
-- as políticas de segurança (RLS) e as FUNÇÕES ATÔMICAS que
-- resolvem de vez o problema de compras simultâneas.
--
-- O ponto central é: nenhuma reserva de número acontece por
-- "ler o status, decidir, e escrever" (que é o que causava o
-- bug do protótipo anterior). Toda reserva passa por uma única
-- instrução UPDATE ... WHERE status = 'disponivel' dentro de
-- uma função, que o Postgres executa de forma atômica. Se dois
-- compradores tentarem o mesmo número no mesmo milissegundo,
-- o banco garante que só um dos UPDATEs "vê" o número como
-- disponível — o outro simplesmente não encontra a linha e a
-- função sabe, com certeza absoluta, que falhou.
-- ============================================================

create extension if not exists "pgcrypto"; -- para gen_random_uuid()

-- ------------------------------------------------------------
-- 1. RIFAS (permite ter mais de uma rifa, hoje ou no futuro)
-- ------------------------------------------------------------
create table if not exists raffles (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  titulo text not null,
  descricao text default '',
  imagem_url text default '',
  total_numeros int not null default 1000,
  preco_por_numero numeric(10,2) not null default 10,
  data_sorteio timestamptz,
  pix_chave text default '',
  pix_nome_recebedor text default '',
  pix_cidade text default 'SAO PAULO',
  pix_instrucoes text default '',
  cakto_link text default '',
  reserva_expira_min int not null default 30,
  sorteio_realizado boolean not null default false,
  numero_vencedor int,
  criado_em timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 2. PEDIDOS (1 pedido = 1 compra, pode ter vários números)
-- ------------------------------------------------------------
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  raffle_id uuid not null references raffles(id) on delete cascade,
  nome text not null,
  whatsapp text not null,
  email text,
  metodo_pagamento text not null check (metodo_pagamento in ('pix','cartao')),
  quantidade int not null check (quantidade > 0),
  valor_total numeric(10,2) not null,
  status text not null default 'pendente' check (status in ('pendente','confirmado','expirado','cancelado')),
  pix_txid text,
  cakto_order_id text,
  criado_em timestamptz not null default now(),
  confirmado_em timestamptz
);
create index if not exists idx_orders_raffle_status on orders (raffle_id, status);

-- ------------------------------------------------------------
-- 3. NÚMEROS (a trava real de concorrência está aqui)
-- ------------------------------------------------------------
create table if not exists raffle_numbers (
  id bigserial primary key,
  raffle_id uuid not null references raffles(id) on delete cascade,
  numero int not null,
  status text not null default 'disponivel' check (status in ('disponivel','reservado','vendido')),
  pedido_id uuid references orders(id) on delete set null,
  reservado_em timestamptz,
  unique (raffle_id, numero)
);
create index if not exists idx_raffle_numbers_raffle_status on raffle_numbers (raffle_id, status);
create index if not exists idx_raffle_numbers_pedido on raffle_numbers (pedido_id);

-- ------------------------------------------------------------
-- 4. ADMINISTRADORES (vinculado ao auth.users do Supabase)
-- ------------------------------------------------------------
create table if not exists admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  email text not null,
  papel text not null default 'admin',
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 5. LOG DE AÇÕES (toda ação administrativa fica registrada)
-- ------------------------------------------------------------
create table if not exists admin_logs (
  id bigserial primary key,
  admin_id uuid references auth.users(id),
  admin_nome text not null,
  acao text not null,
  detalhes jsonb default '{}'::jsonb,
  criado_em timestamptz not null default now()
);
create index if not exists idx_admin_logs_criado on admin_logs (criado_em desc);

-- ============================================================
-- FUNÇÕES ATÔMICAS
-- ============================================================

-- Garante que existem linhas em raffle_numbers de 1 até total_numeros.
-- Pode ser chamada de novo se você aumentar o total_numeros depois.
create or replace function inicializar_numeros(p_raffle_id uuid)
returns void as $$
declare
  v_total int;
  v_existentes int;
begin
  select total_numeros into v_total from raffles where id = p_raffle_id;
  if v_total is null then
    raise exception 'rifa_nao_encontrada';
  end if;

  select count(*) into v_existentes from raffle_numbers where raffle_id = p_raffle_id;

  if v_existentes < v_total then
    insert into raffle_numbers (raffle_id, numero, status)
    select p_raffle_id, gs, 'disponivel'
    from generate_series(v_existentes + 1, v_total) gs
    on conflict (raffle_id, numero) do nothing;
  end if;
end;
$$ language plpgsql security definer;


-- Reserva uma LISTA específica de números (uso: comprador clicou em
-- números específicos na grade). Tudo ou nada: se qualquer um dos
-- números já não estiver mais disponível, a função inteira falha e
-- nada é alterado (nem o pedido é criado).
create or replace function reservar_numeros(
  p_raffle_id uuid,
  p_numeros int[],
  p_nome text,
  p_whatsapp text,
  p_email text default null,
  p_metodo text default 'pix'
) returns json as $$
declare
  v_pedido_id uuid := gen_random_uuid();
  v_preco numeric;
  v_qtd int := array_length(p_numeros, 1);
  v_reservados int[];
begin
  select preco_por_numero into v_preco from raffles where id = p_raffle_id;
  if v_preco is null then
    raise exception 'rifa_nao_encontrada';
  end if;
  if v_qtd is null or v_qtd < 1 then
    raise exception 'nenhum_numero_informado';
  end if;

  insert into orders (id, raffle_id, nome, whatsapp, email, metodo_pagamento, quantidade, valor_total, status)
  values (v_pedido_id, p_raffle_id, p_nome, p_whatsapp, p_email, p_metodo, v_qtd, v_preco * v_qtd, 'pendente');

  with atualizados as (
    update raffle_numbers
    set status = 'reservado', pedido_id = v_pedido_id, reservado_em = now()
    where raffle_id = p_raffle_id
      and numero = any(p_numeros)
      and status = 'disponivel'
    returning numero
  )
  select array_agg(numero) into v_reservados from atualizados;

  if v_reservados is null or array_length(v_reservados, 1) <> v_qtd then
    -- algum número já tinha sido pego: desfaz TUDO (inclusive o pedido)
    raise exception 'numeros_indisponiveis';
  end if;

  return json_build_object(
    'pedido_id', v_pedido_id,
    'numeros', v_reservados,
    'valor_total', v_preco * v_qtd
  );
end;
$$ language plpgsql security definer;


-- Reserva QUANTIDADE números aleatórios entre os disponíveis (uso:
-- comprador só escolhe "quero 5 números"). Usa FOR UPDATE SKIP LOCKED,
-- o padrão de mercado para fila/reserva concorrente: cada transação
-- "trava" só as linhas que está pegando, sem bloquear outros
-- compradores que estão pegando números diferentes ao mesmo tempo.
create or replace function reservar_numeros_aleatorios(
  p_raffle_id uuid,
  p_quantidade int,
  p_nome text,
  p_whatsapp text,
  p_email text default null,
  p_metodo text default 'pix'
) returns json as $$
declare
  v_pedido_id uuid := gen_random_uuid();
  v_preco numeric;
  v_escolhidos int[];
begin
  select preco_por_numero into v_preco from raffles where id = p_raffle_id;
  if v_preco is null then
    raise exception 'rifa_nao_encontrada';
  end if;
  if p_quantidade is null or p_quantidade < 1 then
    raise exception 'quantidade_invalida';
  end if;

  insert into orders (id, raffle_id, nome, whatsapp, email, metodo_pagamento, quantidade, valor_total, status)
  values (v_pedido_id, p_raffle_id, p_nome, p_whatsapp, p_email, p_metodo, p_quantidade, v_preco * p_quantidade, 'pendente');

  with candidatos as (
    select numero from raffle_numbers
    where raffle_id = p_raffle_id and status = 'disponivel'
    order by random()
    limit p_quantidade
    for update skip locked
  ),
  atualizados as (
    update raffle_numbers rn
    set status = 'reservado', pedido_id = v_pedido_id, reservado_em = now()
    from candidatos c
    where rn.raffle_id = p_raffle_id and rn.numero = c.numero
    returning rn.numero
  )
  select array_agg(numero) into v_escolhidos from atualizados;

  if v_escolhidos is null or array_length(v_escolhidos, 1) <> p_quantidade then
    raise exception 'numeros_insuficientes_disponiveis';
  end if;

  return json_build_object(
    'pedido_id', v_pedido_id,
    'numeros', v_escolhidos,
    'valor_total', v_preco * p_quantidade
  );
end;
$$ language plpgsql security definer;


-- Confirma o pagamento de um pedido inteiro (todos os números do
-- pedido passam de "reservado" para "vendido") e registra no log
-- quem confirmou. Chame esta função em vez de fazer UPDATE direto
-- na tabela, para o log de auditoria nunca ficar incompleto.
create or replace function confirmar_pagamento(
  p_pedido_id uuid,
  p_admin_id uuid,
  p_admin_nome text
) returns void as $$
begin
  update orders set status = 'confirmado', confirmado_em = now()
  where id = p_pedido_id and status = 'pendente';

  update raffle_numbers set status = 'vendido'
  where pedido_id = p_pedido_id;

  insert into admin_logs (admin_id, admin_nome, acao, detalhes)
  values (p_admin_id, p_admin_nome, 'confirmar_pagamento', json_build_object('pedido_id', p_pedido_id));
end;
$$ language plpgsql security definer;


-- Libera um pedido (cancela e devolve os números ao pool), com log.
create or replace function liberar_pedido(
  p_pedido_id uuid,
  p_admin_id uuid,
  p_admin_nome text
) returns void as $$
begin
  update orders set status = 'cancelado'
  where id = p_pedido_id and status in ('pendente','confirmado');

  update raffle_numbers set status = 'disponivel', pedido_id = null, reservado_em = null
  where pedido_id = p_pedido_id;

  insert into admin_logs (admin_id, admin_nome, acao, detalhes)
  values (p_admin_id, p_admin_nome, 'liberar_pedido', json_build_object('pedido_id', p_pedido_id));
end;
$$ language plpgsql security definer;


-- Libera reservas que passaram do prazo (chamar periodicamente,
-- por exemplo via um cron job do pg_cron do Supabase ou a cada
-- carregamento de página administrativa).
create or replace function liberar_expirados(p_raffle_id uuid)
returns int as $$
declare
  v_minutos int;
  v_count int;
begin
  select reserva_expira_min into v_minutos from raffles where id = p_raffle_id;

  with liberados as (
    update raffle_numbers
    set status = 'disponivel', pedido_id = null, reservado_em = null
    where raffle_id = p_raffle_id
      and status = 'reservado'
      and reservado_em < now() - (coalesce(v_minutos, 30) || ' minutes')::interval
    returning numero
  )
  select count(*) into v_count from liberados;

  update orders set status = 'expirado'
  where raffle_id = p_raffle_id and status = 'pendente'
    and id not in (select distinct pedido_id from raffle_numbers where pedido_id is not null)
    and criado_em < now() - (coalesce(v_minutos, 30) || ' minutes')::interval;

  return v_count;
end;
$$ language plpgsql security definer;


-- Sorteia o vencedor entre os números VENDIDOS (confirmados) de
-- uma rifa, grava o resultado e registra no log.
create or replace function sortear_vencedor(
  p_raffle_id uuid,
  p_admin_id uuid,
  p_admin_nome text
) returns json as $$
declare
  v_numero int;
  v_pedido_id uuid;
  v_nome text;
begin
  select numero, pedido_id into v_numero, v_pedido_id
  from raffle_numbers
  where raffle_id = p_raffle_id and status = 'vendido'
  order by random()
  limit 1;

  if v_numero is null then
    raise exception 'sem_numeros_vendidos';
  end if;

  select nome into v_nome from orders where id = v_pedido_id;

  update raffles set sorteio_realizado = true, numero_vencedor = v_numero
  where id = p_raffle_id;

  insert into admin_logs (admin_id, admin_nome, acao, detalhes)
  values (p_admin_id, p_admin_nome, 'sortear_vencedor', json_build_object('numero', v_numero, 'nome', v_nome));

  return json_build_object('numero', v_numero, 'nome', v_nome);
end;
$$ language plpgsql security definer;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
-- Compradores (anônimos) só conseguem LER dados públicos e
-- EXECUTAR as funções acima (que são security definer). Eles
-- nunca conseguem fazer UPDATE/INSERT direto nas tabelas —
-- isso garante que toda escrita passa pela lógica atômica e
-- pelo log de auditoria.

alter table raffles enable row level security;
alter table raffle_numbers enable row level security;
alter table orders enable row level security;
alter table admin_profiles enable row level security;
alter table admin_logs enable row level security;

create policy "leitura_publica_raffles" on raffles for select using (true);
create policy "leitura_publica_numeros" on raffle_numbers for select using (true);

create policy "admin_le_pedidos" on orders for select using (
  exists (select 1 from admin_profiles where id = auth.uid() and ativo)
);
create policy "admin_le_logs" on admin_logs for select using (
  exists (select 1 from admin_profiles where id = auth.uid() and ativo)
);
create policy "admin_le_proprio_perfil" on admin_profiles for select using (auth.uid() = id);

create policy "admin_atualiza_raffles" on raffles for update using (
  exists (select 1 from admin_profiles where id = auth.uid() and ativo)
);

-- ============================================================
-- DADOS INICIAIS — exemplo já configurado para o Rotary Butantã
-- ============================================================
insert into raffles (slug, titulo, descricao, total_numeros, preco_por_numero, reserva_expira_min)
values (
  'rotary-butanta-2026',
  'Rifa Solidária — Rotary Club Butantã',
  'Cada número adquirido apoia diretamente os projetos sociais do Rotary Club Butantã.',
  1000,
  10,
  30
)
on conflict (slug) do nothing;

select inicializar_numeros(id) from raffles where slug = 'rotary-butanta-2026';
