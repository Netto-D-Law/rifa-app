-- ============================================================
-- PATCH 003 — RLS DE ADMIN_PROFILES PARA O PAINEL DE EQUIPE
-- ============================================================
-- O patch 002 só permitia que cada admin lesse o PRÓPRIO perfil.
-- Para a tela "Equipe" (listar todos os admins, ativar/desativar),
-- precisamos que qualquer admin ativo possa ver e atualizar os
-- perfis de outros admins. Criamos uma função auxiliar segura
-- (security definer) para evitar qualquer ambiguidade de
-- recursão na política de RLS.
-- ============================================================

create or replace function is_active_admin()
returns boolean as $$
  select exists (
    select 1 from admin_profiles where id = auth.uid() and ativo
  );
$$ language sql security definer stable;

drop policy if exists "admin_le_proprio_perfil" on admin_profiles;
drop policy if exists "admin_le_todos_perfis" on admin_profiles;
create policy "admin_le_todos_perfis" on admin_profiles for select
  using (is_active_admin());

drop policy if exists "admin_atualiza_perfis" on admin_profiles;
create policy "admin_atualiza_perfis" on admin_profiles for update
  using (is_active_admin());
