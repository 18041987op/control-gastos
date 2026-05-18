-- ============================================================
-- DÚPLEX YORO · Esquema para Supabase
-- ============================================================
-- Pega TODO este archivo en el SQL Editor de Supabase
-- (https://supabase.com/dashboard/project/ozfmydiutupboupttkmz/sql/new)
-- y dale Run. Es idempotente: lo puedes correr varias veces sin problema.
-- ============================================================

-- ---------- TABLAS ----------

create table if not exists duplex_meta (
  key        text primary key,
  value      text,
  updated_at timestamptz not null default now()
);

create table if not exists duplex_groups (
  id          text primary key,
  code        text not null,
  name        text not null,
  description text,
  sort_order  int  not null default 0,
  collapsed   boolean not null default false
);

create table if not exists duplex_items (
  id         text primary key,
  group_id   text not null references duplex_groups(id) on delete cascade,
  code       text,
  name       text not null,
  cost       numeric not null default 0,
  prog       int  not null default 0,
  done       boolean not null default false,
  sort_order int  not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists duplex_payments (
  id         uuid primary key default gen_random_uuid(),
  amount     numeric not null,
  paid_on    date,
  note       text,
  created_at timestamptz not null default now()
);

create table if not exists duplex_progress_log (
  id         uuid primary key default gen_random_uuid(),
  item_id    text not null references duplex_items(id) on delete cascade,
  prog_old   int,
  prog_new   int  not null,
  changed_by text not null,                 -- 'owner' | 'contractor'
  note       text,
  created_at timestamptz not null default now()
);

create table if not exists duplex_progress_images (
  id           uuid primary key default gen_random_uuid(),
  log_id       uuid references duplex_progress_log(id) on delete set null,
  item_id      text not null references duplex_items(id) on delete cascade,
  storage_path text not null,
  public_url   text not null,
  caption      text,
  uploaded_by  text not null,
  created_at   timestamptz not null default now()
);

create table if not exists duplex_tasks (
  id         text primary key,
  item_id    text not null references duplex_items(id) on delete cascade,
  code       text,
  name       text not null,
  prog       int  not null default 0,
  done       boolean not null default false,
  weight     numeric not null default 0,
  sort_order int  not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists idx_duplex_items_group     on duplex_items(group_id);
create index if not exists idx_duplex_log_item_recent on duplex_progress_log(item_id, created_at desc);
create index if not exists idx_duplex_imgs_item       on duplex_progress_images(item_id, created_at desc);
create index if not exists idx_duplex_tasks_item      on duplex_tasks(item_id, sort_order);

-- ---------- RLS (mismo patrón abierto que tu app de gastos) ----------

alter table duplex_meta            enable row level security;
alter table duplex_groups          enable row level security;
alter table duplex_items           enable row level security;
alter table duplex_payments        enable row level security;
alter table duplex_progress_log    enable row level security;
alter table duplex_progress_images enable row level security;
alter table duplex_tasks           enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'duplex_meta','duplex_groups','duplex_items',
    'duplex_payments','duplex_progress_log','duplex_progress_images','duplex_tasks'
  ] loop
    execute format('drop policy if exists "anon_all" on public.%I', t);
    execute format(
      'create policy "anon_all" on public.%I for all to anon, authenticated using (true) with check (true)',
      t
    );
  end loop;
end$$;

-- ---------- STORAGE: bucket público para fotos ----------

insert into storage.buckets (id, name, public)
values ('duplex-progress', 'duplex-progress', true)
on conflict (id) do nothing;

drop policy if exists "duplex_imgs_read"   on storage.objects;
drop policy if exists "duplex_imgs_write"  on storage.objects;
drop policy if exists "duplex_imgs_delete" on storage.objects;

create policy "duplex_imgs_read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'duplex-progress');

create policy "duplex_imgs_write" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'duplex-progress');

create policy "duplex_imgs_delete" on storage.objects
  for delete to anon, authenticated
  using (bucket_id = 'duplex-progress');

-- ---------- REALTIME (para sync entre dueño y contratista) ----------

do $$
declare t text;
begin
  foreach t in array array[
    'duplex_items','duplex_payments','duplex_progress_log',
    'duplex_progress_images','duplex_groups','duplex_tasks'
  ] loop
    if not exists (
      select 1 from pg_publication_tables
       where pubname='supabase_realtime' and schemaname='public' and tablename=t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end$$;
