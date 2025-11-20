-- API System Migration
-- This creates the complete API infrastructure with optimized indexes

-- API Keys table for authentication
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL, -- First 8 chars for identification (e.g., "sk_live_")
  is_active BOOLEAN NOT NULL DEFAULT true,
  rate_limit_per_minute INTEGER NOT NULL DEFAULT 60,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Indexes for api_keys
CREATE INDEX IF NOT EXISTS idx_api_keys_tenant ON public.api_keys(tenant_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON public.api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON public.api_keys(is_active) WHERE is_active = true;

-- Webhooks table
CREATE TABLE IF NOT EXISTS public.webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL, -- Array of event types
  is_active BOOLEAN NOT NULL DEFAULT true,
  secret TEXT NOT NULL, -- For signature verification
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for webhooks
CREATE INDEX IF NOT EXISTS idx_webhooks_tenant ON public.webhooks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_active ON public.webhooks(is_active) WHERE is_active = true;

-- Webhook logs for debugging
CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES public.webhooks(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for webhook_logs
CREATE INDEX IF NOT EXISTS idx_webhook_logs_webhook ON public.webhook_logs(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created ON public.webhook_logs(created_at DESC);

-- API request logs for analytics and debugging
CREATE TABLE IF NOT EXISTS public.api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  api_key_id UUID REFERENCES public.api_keys(id) ON DELETE SET NULL,
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for api_logs (partitioned by date for performance)
CREATE INDEX IF NOT EXISTS idx_api_logs_tenant_created ON public.api_logs(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_logs_api_key ON public.api_logs(api_key_id);

-- Optimized indexes for existing tables to support API queries

-- Contacts indexes
CREATE INDEX IF NOT EXISTS idx_contacts_tenant_created ON public.contacts(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON public.contacts(tenant_id, email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_custom_fields ON public.contacts USING GIN (custom_fields);

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_products_tenant_created ON public.products(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(tenant_id, sku) WHERE sku IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(tenant_id, is_active);

-- Appointments indexes
CREATE INDEX IF NOT EXISTS idx_appointments_tenant_start ON public.appointments(tenant_id, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_contact ON public.appointments(contact_id) WHERE contact_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(tenant_id, status);

-- Tasks indexes
CREATE INDEX IF NOT EXISTS idx_tasks_tenant_due ON public.tasks(tenant_id, due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_contact ON public.tasks(contact_id) WHERE contact_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON public.tasks(tenant_id, completed);

-- Cards indexes
CREATE INDEX IF NOT EXISTS idx_cards_tenant_pipeline ON public.cards(tenant_id, pipeline_id);
CREATE INDEX IF NOT EXISTS idx_cards_stage ON public.cards(stage_id);
CREATE INDEX IF NOT EXISTS idx_cards_contact ON public.cards(contact_id) WHERE contact_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cards_position ON public.cards(stage_id, position);

-- Stages indexes
CREATE INDEX IF NOT EXISTS idx_stages_pipeline_order ON public.stages(pipeline_id, order_index);

-- Pipelines indexes
CREATE INDEX IF NOT EXISTS idx_pipelines_tenant ON public.pipelines(tenant_id);

-- RLS Policies for API tables
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own tenant's API keys
CREATE POLICY "Users can view own tenant api_keys"
  ON public.api_keys FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can create API keys for their tenant
CREATE POLICY "Users can create api_keys"
  ON public.api_keys FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can update their tenant's API keys
CREATE POLICY "Users can update api_keys"
  ON public.api_keys FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can delete their tenant's API keys
CREATE POLICY "Users can delete api_keys"
  ON public.api_keys FOR DELETE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid()
    )
  );

-- Similar policies for webhooks
CREATE POLICY "Users can view own tenant webhooks"
  ON public.webhooks FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create webhooks"
  ON public.webhooks FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update webhooks"
  ON public.webhooks FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete webhooks"
  ON public.webhooks FOR DELETE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid()
    )
  );

-- Webhook logs - view only
CREATE POLICY "Users can view own tenant webhook_logs"
  ON public.webhook_logs FOR SELECT
  TO authenticated
  USING (
    webhook_id IN (
      SELECT id FROM public.webhooks WHERE tenant_id IN (
        SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid()
      )
    )
  );

-- API logs - view only
CREATE POLICY "Users can view own tenant api_logs"
  ON public.api_logs FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.user_roles WHERE user_id = auth.uid()
    )
  );

-- Function to automatically update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON public.api_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_webhooks_updated_at
  BEFORE UPDATE ON public.webhooks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to clean old logs (call this periodically)
CREATE OR REPLACE FUNCTION public.clean_old_api_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM public.api_logs WHERE created_at < NOW() - INTERVAL '90 days';
  DELETE FROM public.webhook_logs WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
