-- ============================================================
-- DÚPLEX YORO · Migración 003 · Renombre de hitos
-- ============================================================
-- Si ya corriste migration_002, corre esto para actualizar los
-- nombres de los hitos a la versión más clara que comunica
-- CUÁNDO se debe togglear cada uno:
--
--   Hito 1 (50%): al iniciar — compra de materiales
--   Hito 2 (30%): cuando la obra esté al 80%  ← ANTES decía "a mitad"
--   Hito 3 (20%): al entregar la obra al 100%
--
-- Por qué: marcar el 30% "a mitad de obra" significaría pagar
-- 80% acumulado por solo 50% de trabajo terminado — adelanto
-- de cobro. Mejor: 30% al 80% de avance, 20% al cierre.
--
-- Solo cambia nombres. NO toca progreso, NO borra historial.
-- Idempotente.
-- ============================================================

update duplex_items
   set name = 'Entrada (50%) — al iniciar la obra (compra de materiales)'
 where id = 'base_h1';

update duplex_items
   set name = 'Avance intermedio (30%) — cuando la obra esté al 80%'
 where id = 'base_h2';

update duplex_items
   set name = 'Finalización (20%) — al entregar la obra al 100%'
 where id = 'base_h3';
