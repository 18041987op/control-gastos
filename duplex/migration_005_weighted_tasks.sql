-- ============================================================
-- DÚPLEX YORO · Migración 005 · Tareas con weight + base unificado
-- ============================================================
-- Cambio importante:
--
-- - Las 30 tareas dejan de estar bajo 3 hitos. Ahora todas
--   cuelgan de UNA sola partida "base_main" (L 392,500).
-- - Cada tarea tiene un WEIGHT (precio relativo) usado solo
--   para calcular el % de avance ponderado del base.
-- - Los pesos suman ~L 428,000 (estimados de precios unitarios
--   del contratista) pero el "pago ganado" del base se calcula
--   como L 392,500 × avance_ponderado (el contrato es 392,500).
-- - El esquema 50/30/20 deja de ser items billables; queda
--   solo como descripción del grupo (informativa).
--
-- Idempotente. Reseteará el progreso de las tareas (parte de la
-- migración estructural). Las adiciones (B/C) no se tocan.
-- ============================================================

-- 1) Agregar columna weight a duplex_tasks
alter table duplex_tasks add column if not exists weight numeric not null default 0;

-- 2) Borrar las partidas viejas del grupo base (3 hitos + 30 tareas via CASCADE)
delete from duplex_items where group_id = 'base';

-- 3) Insertar la única partida del base
insert into duplex_items (id, group_id, code, name, cost, prog, done, sort_order) values
  ('base_main', 'base', '★', 'Contrato base completo · 30 trabajos', 392500, 0, false, 0);

-- 4) Actualizar descripción del grupo base
update duplex_groups
   set name        = 'Contrato Base (PDF Gómez & Rivera)',
       description = 'Remodelación completa · L 392,500 · pago 50% entrada + 30% al 80% avance + 20% al cierre'
 where id = 'base';

-- 5) Insertar las 30 tareas con weight (pesos = precios estimados del contratista)
insert into duplex_tasks (id, item_id, code, name, weight, sort_order) values
  ('t01','base_main','1', 'Instalación de 25 unidades de tomacorrientes 120v',                       17125,  0),
  ('t02','base_main','2', 'Instalación de 6 unidades de tomacorrientes de 220v',                      5010,  1),
  ('t03','base_main','3', 'Instalación de 14 spot light (sala/comedor/cocina/baños/lavandería/porch/lateral)', 9100,  2),
  ('t04','base_main','4', 'Instalar 1 ventilador de techo de 52"',                                    4375,  3),
  ('t05','base_main','5', 'Instalación de panel eléctrico',                                          11000,  4),
  ('t06','base_main','6', 'Cambiar cable de acometida',                                               4000,  5),
  ('t07','base_main','7', 'Reparación de tubería sanitaria y potable',                                5870,  6),
  ('t08','base_main','8', 'Instalación de 2 duchas',                                                  2200,  7),
  ('t09','base_main','9', 'Instalación de 2 sanitarios',                                              8500,  8),
  ('t10','base_main','10','Enchapar con cerámica área de ducha (8.64 m² altura 2.10)',                7214,  9),
  ('t11','base_main','11','Fundir plancha de concreto para lavadora y secadora',                      4500, 10),
  ('t12','base_main','12','Hacer acera peatonal de 0.10 cm total 40.79 ml',                          18954, 11),
  ('t13','base_main','13','Subir pared divisoria de lavandería 2.20 m, repellar y pulir',             2600, 12),
  ('t14','base_main','14','Demoler cocina',                                                            900, 13),
  ('t15','base_main','15','Instalar cielo falso con tablilla PVC blanco 72 m²',                      56160, 14),
  ('t16','base_main','16','Hacer mueble de lavatrastes interior de cedro con MDF',                   36000, 15),
  ('t17','base_main','17','Instalación lavatrasto completo',                                          4500, 16),
  ('t18','base_main','18','Instalar top de porcelánica (granito básico)',                            16500, 17),
  ('t19','base_main','19','Hacer torre de alacena 7 pies de alto (no incluye mueble aéreo)',         22000, 18),
  ('t20','base_main','20','Hacer cerca de separación con rejilla color verde de 1.50 m de altura',   20154, 19),
  ('t21','base_main','21','Hacer portón corredizo con portón peatonal incluido',                     28552, 20),
  ('t22','base_main','22','Rellenar con selecto área frontal de terreno',                            17200, 21),
  ('t23','base_main','23','Cambiar ventanas por ventanas de PVC blanco con vidrio color bronce',     49500, 22),
  ('t24','base_main','24','Hacer estructura de tanque incluye tanque de 1,100 litros',               21135, 23),
  ('t25','base_main','25','Hacer lavadero',                                                           4000, 24),
  ('t26','base_main','26','Extender techo de casa hacia muro',                                       14000, 25),
  ('t27','base_main','27','Cambiar 7 contramarco de laurel',                                         10500, 26),
  ('t28','base_main','28','Instalar 7 puertas con sus respectivos llavines (no incluye puertas)',    12000, 27),
  ('t29','base_main','29','Reparar fisuras en pared por los 2 lados',                                 6451, 28),
  ('t30','base_main','30','Poner tablilla en aleros',                                                 8000, 29);
