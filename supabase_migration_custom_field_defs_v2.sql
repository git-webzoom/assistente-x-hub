-- ============================================
-- MIGRATION V2: Normalize custom_field_defs schema and fix legacy columns
-- Safe to run multiple times (idempotent)
-- ============================================

-- Pre-req for gen_random_uuid
create extension if not exists pgcrypto;

-- 0) Ensure table exists (minimal columns first)
create table if not exists public.custom_field_defs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  entity_name text not null,
  field_name text not null,
  field_label text not null,
  field_type text not null
);

-- 1) Handle legacy column names (options -> field_options)
do $$ begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'custom_field_defs' and column_name = 'options'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'custom_field_defs' and column_name = 'field_options'
  ) then
    alter table public.custom_field_defs rename column options to field_options;
  end if;
end $$;

-- 2) Add missing columns with safe defaults
alter table public.custom_field_defs
  add column if not exists field_options jsonb,
  add column if not exists default_value text,
  add column if not exists is_required boolean not null default false,
  add column if not exists display_order integer not null default 0,
  add column if not exists is_active boolean not null default true,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

-- Ensure field_options type is jsonb and not null with default []
alter table public.custom_field_defs
  alter column field_options type jsonb using (
    case
      when field_options is null then '[]'::jsonb
      when pg_typeof(field_options)::text in ('json', 'jsonb') then field_options::jsonb
      else to_jsonb(field_options)
    end
  ),
  alter column field_options set default '[]'::jsonb,
  alter column field_options set not null;

-- 3) FK to tenants (if not present)
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.custom_field_defs'::regclass
      and conname = 'custom_field_defs_tenant_id_fkey'
  ) then
    alter table public.custom_field_defs
    add constraint custom_field_defs_tenant_id_fkey
    foreign key (tenant_id) references public.tenants(id) on delete cascade;
  end if;
end $$;

-- 4) Uniqueness and helpful indexes
create unique index if not exists idx_custom_field_defs_uni on public.custom_field_defs (tenant_id, entity_name, field_name);
create index if not exists idx_custom_field_defs_tenant_entity on public.custom_field_defs (tenant_id, entity_name);

-- 5) updated_at trigger
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_custom_field_defs_updated_at on public.custom_field_defs;
create trigger update_custom_field_defs_updated_at
before update on public.custom_field_defs
for each row execute function public.update_updated_at_column();

-- 6) Ensure contacts.custom_fields exists as jsonb object
alter table public.contacts
  add column if not exists custom_fields jsonb not null default '{}'::jsonb;

-- 7) RLS
alter table public.custom_field_defs enable row level security;

-- SELECT policy
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'custom_field_defs' AND policyname = 'tenant_read_custom_field_defs'
  ) THEN
    CREATE POLICY tenant_read_custom_field_defs
    ON public.custom_field_defs
    FOR SELECT TO authenticated
    USING (
      tenant_id IN (
        SELECT tenant_id FROM public.users u WHERE u.id = auth.uid()
      )
    );
  END IF;
END $$;

-- INSERT policy
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'custom_field_defs' AND policyname = 'tenant_insert_custom_field_defs'
  ) THEN
    CREATE POLICY tenant_insert_custom_field_defs
    ON public.custom_field_defs
    FOR INSERT TO authenticated
    WITH CHECK (
      tenant_id IN (
        SELECT tenant_id FROM public.users u WHERE u.id = auth.uid()
      )
    );
  END IF;
END $$;

-- UPDATE policy
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'custom_field_defs' AND policyname = 'tenant_update_custom_field_defs'
  ) THEN
    CREATE POLICY tenant_update_custom_field_defs
    ON public.custom_field_defs
    FOR UPDATE TO authenticated
    USING (
      tenant_id IN (
        SELECT tenant_id FROM public.users u WHERE u.id = auth.uid()
      )
    )
    WITH CHECK (
      tenant_id IN (
        SELECT tenant_id FROM public.users u WHERE u.id = auth.uid()
      )
    );
  END IF;
END $$;

-- DELETE policy
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'custom_field_defs' AND policyname = 'tenant_delete_custom_field_defs'
  ) THEN
    CREATE POLICY tenant_delete_custom_field_defs
    ON public.custom_field_defs
    FOR DELETE TO authenticated
    USING (
      tenant_id IN (
        SELECT tenant_id FROM public.users u WHERE u.id = auth.uid()
      )
    );
  END IF;
END $$;

-- 8) Sanity check (optional): ensure jsonb default values
update public.custom_field_defs
set field_options = coalesce(field_options, '[]'::jsonb)
where field_options is null;
