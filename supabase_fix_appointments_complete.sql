-- ============================================
-- COMPLETE FIX: Appointments RLS Issue
-- Execute este script completo no SQL Editor do Supabase
-- ============================================

-- STEP 1: Ensure get_user_tenant function exists
CREATE OR REPLACE FUNCTION public.get_user_tenant(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id 
  FROM public.users 
  WHERE id = _user_id
  LIMIT 1
$$;

-- STEP 2: Add tenant_id column to appointments if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'appointments' 
    AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE public.appointments 
    ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

-- STEP 3: Create index for performance
CREATE INDEX IF NOT EXISTS idx_appointments_tenant_id 
ON public.appointments(tenant_id);

-- STEP 4: Update existing appointments with tenant_id
UPDATE public.appointments a
SET tenant_id = COALESCE(
  (SELECT tenant_id FROM public.contacts c WHERE c.id = a.contact_id),
  (SELECT tenant_id FROM public.cards cd WHERE cd.id = a.card_id)
)
WHERE tenant_id IS NULL;

-- STEP 5: Make tenant_id NOT NULL
DO $$ 
BEGIN
  ALTER TABLE public.appointments 
  ALTER COLUMN tenant_id SET NOT NULL;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Could not set tenant_id as NOT NULL. Check if all rows have tenant_id populated.';
END $$;

-- STEP 6: Drop old RLS policies
DROP POLICY IF EXISTS "Users can manage appointments in tenant" ON public.appointments;
DROP POLICY IF EXISTS "Users can view appointments in tenant" ON public.appointments;
DROP POLICY IF EXISTS "Users can insert appointments in tenant" ON public.appointments;
DROP POLICY IF EXISTS "Users can update appointments in tenant" ON public.appointments;
DROP POLICY IF EXISTS "Users can delete appointments in tenant" ON public.appointments;

-- STEP 7: Enable RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- STEP 8: Create new simplified RLS policy
CREATE POLICY "Users can manage appointments in tenant"
ON public.appointments
FOR ALL
TO authenticated
USING (tenant_id = public.get_user_tenant(auth.uid()))
WITH CHECK (tenant_id = public.get_user_tenant(auth.uid()));

-- STEP 9: Grant necessary permissions
GRANT ALL ON public.appointments TO authenticated;

-- Verification query (optional - run separately to check)
-- SELECT 
--   'appointments' as table_name,
--   COUNT(*) as total_rows,
--   COUNT(tenant_id) as rows_with_tenant,
--   COUNT(*) - COUNT(tenant_id) as rows_without_tenant
-- FROM public.appointments;

SELECT 'Migration completed successfully!' as status;
