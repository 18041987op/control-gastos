-- ============================================================
-- DÚPLEX YORO · Migración 002 · Base como 3 hitos
-- ============================================================
-- Reemplaza las 22 partidas inventadas del PDF (donde dividí
-- arbitrariamente los L 392,500 entre 22 ítems) por las 3
-- partidas reales del contrato según "forma de pago" del PDF:
--   50% entrada + 30% evaluando avance + 20% al finalizar.
--
-- Las 30 tareas del PDF dejan de ser partidas individuales y
-- pasan a mostrarse como "alcance del contrato" en el frontend.
--
-- ADICIONES (grupos add1 y add2) NO se tocan — esas sí tienen
-- precio individual real por trabajo.
--
-- Correr en SQL Editor de Supabase. Idempotente.
-- ============================================================

-- 1) Borra todas las partidas del grupo base (las 22 inventadas
--    o las 3 nuevas si ya corriste esto antes). CASCADE borra
--    también logs e imágenes asociadas a esas partidas viejas.
delete from duplex_items where group_id = 'base';

-- 2) Inserta las 3 partidas de hito reales
insert into duplex_items (id, group_id, code, name, cost, prog, done, sort_order) values
  ('base_h1', 'base', '1', 'Entrada (50%) — al iniciar la obra (compra de materiales)', 196250, 0, false, 0),
  ('base_h2', 'base', '2', 'Avance intermedio (30%) — cuando la obra esté al 80%',      117750, 0, false, 1),
  ('base_h3', 'base', '3', 'Finalización (20%) — al entregar la obra al 100%',           78500, 0, false, 2);

-- 3) Actualiza la descripción y nombre del grupo base
update duplex_groups
   set name        = 'Contrato Base (PDF Gómez & Rivera)',
       description = 'Remodelación completa · pago por 3 hitos · total L 392,500'
 where id = 'base';
