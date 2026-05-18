-- ============================================================
-- DÚPLEX YORO · Migración 004 · Tareas bajo hitos
-- ============================================================
-- Agrega tabla duplex_tasks con las 30 tareas del PDF
-- distribuidas bajo los 3 hitos del contrato base.
--
-- Cada tarea tiene su propio progreso (0/50/100). El avance
-- del hito = promedio del progreso de sus tareas. El "pago
-- ganado" del hito = costo × avance derivado.
--
-- Las tareas reemplazan la lista estática "Ver alcance del
-- contrato" — ahora son interactivas.
--
-- Idempotente. Las adiciones (B/C) no se tocan.
-- ============================================================

-- Tabla
create table if not exists duplex_tasks (
  id         text primary key,
  item_id    text not null references duplex_items(id) on delete cascade,
  code       text,
  name       text not null,
  prog       int  not null default 0,
  done       boolean not null default false,
  sort_order int  not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists idx_duplex_tasks_item on duplex_tasks(item_id, sort_order);

alter table duplex_tasks enable row level security;

do $$
begin
  execute 'drop policy if exists "anon_all" on public.duplex_tasks';
  execute 'create policy "anon_all" on public.duplex_tasks for all to anon, authenticated using (true) with check (true)';
end$$;

-- Realtime
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
     where pubname='supabase_realtime' and schemaname='public' and tablename='duplex_tasks'
  ) then
    alter publication supabase_realtime add table public.duplex_tasks;
  end if;
end$$;

-- Seed (idempotente): borra y vuelve a insertar las tareas del contrato base
delete from duplex_tasks
 where item_id in ('base_h1','base_h2','base_h3');

insert into duplex_tasks (id, item_id, code, name, sort_order) values
  -- HITO 1 · entrada · 11 tareas (grueso / materiales / preparación)
  ('t_h1_01','base_h1','14','Demoler cocina', 0),
  ('t_h1_02','base_h1','11','Fundir plancha de concreto para lavadora y secadora', 1),
  ('t_h1_03','base_h1','12','Hacer acera peatonal de 0.10 cm total 40.79 ml', 2),
  ('t_h1_04','base_h1','22','Rellenar con selecto área frontal de terreno', 3),
  ('t_h1_05','base_h1','13','Subir pared divisoria de lavandería 2.20 m, repellar y pulir', 4),
  ('t_h1_06','base_h1','26','Extender techo de casa hacia muro', 5),
  ('t_h1_07','base_h1','5', 'Instalación de panel eléctrico', 6),
  ('t_h1_08','base_h1','6', 'Cambiar cable de acometida', 7),
  ('t_h1_09','base_h1','7', 'Reparación de tubería sanitaria y potable', 8),
  ('t_h1_10','base_h1','24','Hacer estructura de tanque incluye tanque de 1,100 litros', 9),
  ('t_h1_11','base_h1','25','Hacer lavadero', 10),

  -- HITO 2 · avance intermedio · 15 tareas (instalaciones / acabados)
  ('t_h2_01','base_h2','1', 'Instalación de 25 unidades de tomacorrientes 120v', 0),
  ('t_h2_02','base_h2','2', 'Instalación de 6 unidades de tomacorrientes de 220v', 1),
  ('t_h2_03','base_h2','3', 'Instalación de 14 spot light (sala/comedor/cocina/baños/lavandería/porch/lateral)', 2),
  ('t_h2_04','base_h2','4', 'Instalar 1 ventilador de techo de 52"', 3),
  ('t_h2_05','base_h2','8', 'Instalación de 2 duchas', 4),
  ('t_h2_06','base_h2','9', 'Instalación de un sanitario de 2 piezas', 5),
  ('t_h2_07','base_h2','10','Enchapar con cerámica área de ducha (8.64 m² altura 2.10)', 6),
  ('t_h2_08','base_h2','15','Instalar cielo falso con tablilla PVC blanco 72 m²', 7),
  ('t_h2_09','base_h2','16','Hacer mueble de lavatrastes interior de cedro con MDF', 8),
  ('t_h2_10','base_h2','17','Instalación lavatrasto completo', 9),
  ('t_h2_11','base_h2','18','Instalar top de porcelánica (granito básico)', 10),
  ('t_h2_12','base_h2','19','Hacer torre de alacena 7 pies de alto (no incluye mueble aéreo)', 11),
  ('t_h2_13','base_h2','20','Hacer cerca de separación con rejilla color verde de 1.50 m de altura', 12),
  ('t_h2_14','base_h2','21','Hacer portón corredizo con portón peatonal incluido', 13),
  ('t_h2_15','base_h2','23','Cambiar ventanas por ventanas de PVC blanco con vidrio color bronce', 14),

  -- HITO 3 · finalización · 4 tareas (detalles / entrega)
  ('t_h3_01','base_h3','27','Cambiar 7 contramarco de laurel', 0),
  ('t_h3_02','base_h3','28','Instalar 7 puertas con sus respectivos llavines (no incluye puertas)', 1),
  ('t_h3_03','base_h3','29','Reparar fisuras en pared por los 2 lados', 2),
  ('t_h3_04','base_h3','30','Poner tablilla en aleros', 3);
