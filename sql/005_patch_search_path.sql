-- ============================================================
-- PATCH 005 — CORRIGE SEARCH_PATH DO GATILHO DE NOVO ADMIN
-- ============================================================
-- Sintoma: convidar um administrador falhava com "Database error
-- saving new user", e o log do Postgres mostrava:
--   ERROR: relation "admin_profiles" does not exist
--
-- Causa: o gatilho handle_new_admin_user() dispara a partir de uma
-- operação em auth.users. Nesse contexto, o search_path padrão não
-- necessariamente inclui o schema "public", então a referência sem
-- qualificação a "admin_profiles" não era encontrada. A correção é
-- qualificar o schema explicitamente e fixar o search_path da função.
-- ============================================================

create or replace function handle_new_admin_user()
returns trigger as $$
begin
  insert into public.admin_profiles (id, nome, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public, auth;
