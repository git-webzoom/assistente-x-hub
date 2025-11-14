-- ============================================
-- MIGRATION: Add tenant_id to appointments
-- ============================================

-- Add tenant_id column to appointments table
ALTER TABLE public.appointments 
ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX idx_appointments_tenant_id ON public.appointments(tenant_id);

-- Update existing appointments to have tenant_id from their contact or card
UPDATE public.appointments a
SET tenant_id = COALESCE(
  (SELECT tenant_id FROM public.contacts c WHERE c.id = a.contact_id),
  (SELECT tenant_id FROM public.cards cd WHERE cd.id = a.card_id)
);

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
