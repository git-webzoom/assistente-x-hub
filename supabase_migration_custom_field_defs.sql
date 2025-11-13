-- ============================================
-- MIGRATION: Ensure custom_field_defs schema and related columns exist
-- Execute this in your SQL editor
-- Idempotent: safe to run multiple times
-- ============================================

-- 1) Create table if it doesn't exist
create table if not exists public.custom_field_defs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  entity_name text not null,
  field_name text not null,
  field_label text not null,
  field_type text not null,
  field_options jsonb not null default '[]'::jsonb,
  default_value text null,
  is_required boolean not null default false,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) Add any missing columns if table already existed
alter table public.custom_field_defs
  add column if not exists tenant_id uuid,
  add column if not exists entity_name text,
  add column if not exists field_name text,
  add column if not exists field_label text,
  add column if not exists field_type text,
  add column if not exists field_options jsonb not null default '[]'::jsonb,
  add column if not exists default_value text,
  add column if not exists is_required boolean not null default false,
  add column if not exists display_order integer not null default 0,
  add column if not exists is_active boolean not null default true,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

-- Ensure tenant_id has the FK to tenants
do $$ begin
  if not exists (
    select 1 from pg_constraint 
    where conname = 'custom_field_defs_tenant_id_fkey'
  ) then
    alter table public.custom_field_defs
    add constraint custom_field_defs_tenant_id_fkey
    foreign key (tenant_id) references public.tenants(id) on delete cascade;
  end if;
end $$;

-- 3) Helpful indexes and uniqueness (unique index instead of constraint for idempotency)
create unique index if not exists idx_custom_field_defs_uni
  on public.custom_field_defs (tenant_id, entity_name, field_name);

create index if not exists idx_custom_field_defs_tenant_entity
  on public.custom_field_defs (tenant_id, entity_name);

-- 4) Ensure update_updated_at function exists
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 5) Trigger to auto-update updated_at
drop trigger if exists update_custom_field_defs_updated_at on public.custom_field_defs;
create trigger update_custom_field_defs_updated_at
before update on public.custom_field_defs
for each row execute function public.update_updated_at_column();

-- 6) Ensure contacts.custom_fields exists (object for key-value pairs)
alter table public.contacts
  add column if not exists custom_fields jsonb not null default '{}'::jsonb;

-- 7) Enable RLS and add tenant-based policies using users.tenant_id
alter table public.custom_field_defs enable row level security;

-- SELECT policy
do $$ begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' and tablename = 'custom_field_defs' 
      and policyname = 'tenant_read_custom_field_defs'
  ) then
    create policy tenant_read_custom_field_defs
    on public.custom_field_defs
    for select
    to authenticated
    using (
      tenant_id in (
        select tenant_id from public.users u where u.id = auth.uid()
      )
    );
  end if;
end $$;

-- INSERT policy
do $$ begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' and tablename = 'custom_field_defs' 
      and policyname = 'tenant_insert_custom_field_defs'
  ) then
    create policy tenant_insert_custom_field_defs
    on public.custom_field_defs
    for insert
    to authenticated
    with check (
      tenant_id in (
        select tenant_id from public.users u where u.id = auth.uid()
      )
    );
  end if;
end $$;

-- UPDATE policy
do $$ begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' and tablename = 'custom_field_defs' 
      and policyname = 'tenant_update_custom_field_defs'
  ) then
    create policy tenant_update_custom_field_defs
    on public.custom_field_defs
    for update
    to authenticated
    using (
      tenant_id in (
        select tenant_id from public.users u where u.id = auth.uid()
      )
    )
    with check (
      tenant_id in (
        select tenant_id from public.users u where u.id = auth.uid()
      )
    );
  end if;
end $$;

-- DELETE policy
do $$ begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' and tablename = 'custom_field_defs' 
      and policyname = 'tenant_delete_custom_field_defs'
  ) then
    create policy tenant_delete_custom_field_defs
    on public.custom_field_defs
    for delete
    to authenticated
    using (
      tenant_id in (
        select tenant_id from public.users u where u.id = auth.uid()
      )
    );
  end if;
end $$;
