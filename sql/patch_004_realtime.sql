-- ============================================================
-- PATCH 004 — HABILITA REALTIME NA TABELA raffle_numbers
-- ============================================================
-- Sem isso, o app Next.js continua funcionando, mas a grade de
-- números no site público só atualiza quando a página é recarregada
-- (em vez de mudar sozinha quando alguém reserva/compra em tempo real).
-- ============================================================

alter publication supabase_realtime add table raffle_numbers;
