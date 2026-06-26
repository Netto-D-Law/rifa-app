-- ============================================================
-- PATCH 002 — SEGURANÇA DE ADMIN + AUTO-PERFIL + STORAGE
-- ============================================================
-- Rode isso DEPOIS do supabase_schema.sql, no mesmo SQL Editor.
--
-- O QUE ESTE PATCH CORRIGE:
-- As funções confirmar_pagamento/liberar_pedido/sortear_vencedor
-- originais recebiam "p_admin_id" e "p_admin_nome" como parâmetros
-- enviados pelo cliente. Isso é inseguro: como essas funções ficam
-- expostas via API (RPC) e a "Publishable key" é pública por
-- definição, qualquer pessoa poderia chamar a função e MENTIR
-- sobre quem ela é, poluindo o log de auditoria com um nome falso
-- (ou pior, sem nenhuma verificação real de que é admin).
--
-- A correção: a identidade do admin agora vem de auth.uid(), que o
-- Postgres preenche sozinho a partir do token de login da pessoa —
-- não é possível falsificar isso pelo lado do cliente.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Remove as versões antigas (assinatura diferente = função
--    diferente para o Postgres, por isso precisamos apagar antes)
-- ------------------------------------------------------------
drop function if exists confirmar_pagamento(uuid, uuid, text);
drop function if exists liberar_pedido(uuid, uuid, text);
drop function if exists sortear_vencedor(uuid, uuid, text);

-- ------------------------------------------------------------
-- 2. Recria com verificação real de admin via auth.uid()
-- ------------------------------------------------------------
create or replace function confirmar_pagamento(p_pedido_id uuid)
returns void as $$
declare
  v_admin_nome text;
begin
  select nome into v_admin_nome from admin_profiles where id = auth.uid() and ativo;
  if v_admin_nome is null then
    raise exception 'acesso_negado';
  end if;

  update orders set status = 'confirmado', confirmado_em = now()
  where id = p_pedido_id and status = 'pendente';

  update raffle_numbers set status = 'vendido'
  where pedido_id = p_pedido_id;

  insert into admin_logs (admin_id, admin_nome, acao, detalhes)
  values (auth.uid(), v_admin_nome, 'confirmar_pagamento', json_build_object('pedido_id', p_pedido_id));
end;
$$ language plpgsql security definer;


create or replace function liberar_pedido(p_pedido_id uuid)
returns void as $$
declare
  v_admin_nome text;
begin
  select nome into v_admin_nome from admin_profiles where id = auth.uid() and ativo;
  if v_admin_nome is null then
    raise exception 'acesso_negado';
  end if;

  update orders set status = 'cancelado'
  where id = p_pedido_id and status in ('pendente','confirmado');

  update raffle_numbers set status = 'disponivel', pedido_id = null, reservado_em = null
  where pedido_id = p_pedido_id;

  insert into admin_logs (admin_id, admin_nome, acao, detalhes)
  values (auth.uid(), v_admin_nome, 'liberar_pedido', json_build_object('pedido_id', p_pedido_id));
end;
$$ language plpgsql security definer;


create or replace function sortear_vencedor(p_raffle_id uuid)
returns json as $$
declare
  v_admin_nome text;
  v_numero int;
  v_pedido_id uuid;
  v_nome text;
begin
  select nome into v_admin_nome from admin_profiles where id = auth.uid() and ativo;
  if v_admin_nome is null then
    raise exception 'acesso_negado';
  end if;

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
  values (auth.uid(), v_admin_nome, 'sortear_vencedor', json_build_object('numero', v_numero, 'nome', v_nome));

  return json_build_object('numero', v_numero, 'nome', v_nome);
end;
$$ language plpgsql security definer;

-- ------------------------------------------------------------
-- 3. Auto-cria o perfil de administrador quando alguém aceita
--    o convite (login criado no auth.users). Assim você não
--    precisa de um passo manual extra depois do convite.
-- ------------------------------------------------------------
create or replace function handle_new_admin_user()
returns trigger as $$
begin
  insert into admin_profiles (id, nome, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_admin_user();

-- ------------------------------------------------------------
-- 4. Bucket de Storage para a foto do prêmio + políticas
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('premios', 'premios', true)
on conflict (id) do nothing;

drop policy if exists "leitura_publica_premios" on storage.objects;
create policy "leitura_publica_premios" on storage.objects for select
  using (bucket_id = 'premios');

drop policy if exists "admin_upload_premios" on storage.objects;
create policy "admin_upload_premios" on storage.objects for insert
  with check (
    bucket_id = 'premios'
    and exists (select 1 from admin_profiles where id = auth.uid() and ativo)
  );

drop policy if exists "admin_atualiza_premios" on storage.objects;
create policy "admin_atualiza_premios" on storage.objects for update
  using (
    bucket_id = 'premios'
    and exists (select 1 from admin_profiles where id = auth.uid() and ativo)
  );

drop policy if exists "admin_remove_premios" on storage.objects;
create policy "admin_remove_premios" on storage.objects for delete
  using (
    bucket_id = 'premios'
    and exists (select 1 from admin_profiles where id = auth.uid() and ativo)
  );
