# 🔧 Instruções de Migration - Appointments

## Problema Resolvido
O erro de "violates row-level security policy" na tabela `appointments` foi causado por:
1. A tabela não tinha a coluna `tenant_id` (obrigatória para RLS)
2. A política RLS antiga exigia `card_id` OU `contact_id`, mas ambos são opcionais

## ✅ Execute esta Migration no Supabase

Acesse o **SQL Editor** do seu projeto Supabase e execute o seguinte SQL:

```sql
-- ============================================
-- MIGRATION: Add tenant_id to appointments
-- ============================================

-- Add tenant_id column to appointments table (if it doesn't exist)
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Create index for better query performance (if it doesn't exist)
CREATE INDEX IF NOT EXISTS idx_appointments_tenant_id ON public.appointments(tenant_id);

-- Update existing appointments to have tenant_id from their contact or card
UPDATE public.appointments a
SET tenant_id = COALESCE(
  (SELECT tenant_id FROM public.contacts c WHERE c.id = a.contact_id),
  (SELECT tenant_id FROM public.cards cd WHERE cd.id = a.card_id)
)
WHERE tenant_id IS NULL;

-- Make tenant_id required for new appointments
ALTER TABLE public.appointments 
ALTER COLUMN tenant_id SET NOT NULL;

-- Drop old RLS policy
DROP POLICY IF EXISTS "Users can manage appointments in tenant" ON public.appointments;

-- Create new simplified RLS policy using tenant_id
CREATE POLICY "Users can manage appointments in tenant"
  ON public.appointments
  FOR ALL
  TO authenticated
  USING (tenant_id = public.get_user_tenant(auth.uid()))
  WITH CHECK (tenant_id = public.get_user_tenant(auth.uid()));
```

## 📝 O que foi Alterado

1. **Schema Inicial** (`supabase_setup.sql`):
   - Adicionada coluna `tenant_id` na criação da tabela `appointments`
   - Política RLS simplificada usando `tenant_id` diretamente

2. **Migration** (`supabase_migration_appointments_tenant.sql`):
   - Tornada idempotente com `IF NOT EXISTS`
   - Migra dados existentes antes de tornar `tenant_id` obrigatório

3. **Hook** (`useAppointments.ts`):
   - Interface `Appointment` atualizada com campo `tenant_id`
   - `createAppointment` já insere o `tenant_id` corretamente

## ✨ Próximos Passos

Após executar a migration:
1. O sistema de agendamentos funcionará corretamente
2. Novos agendamentos terão `tenant_id` automaticamente
3. A segurança RLS estará garantida por tenant
