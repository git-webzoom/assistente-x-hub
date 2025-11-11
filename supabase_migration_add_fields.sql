-- ============================================
-- MIGRATION: Add missing fields to tables
-- Execute this in Supabase SQL Editor
-- ============================================

-- Add position and tags to cards table
ALTER TABLE public.cards 
ADD COLUMN IF NOT EXISTS position integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS tags jsonb DEFAULT '[]'::jsonb;

-- Add updated_at to pipelines table
ALTER TABLE public.pipelines 
ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Add updated_at to stages table
ALTER TABLE public.stages 
ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Create trigger function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
DROP TRIGGER IF EXISTS update_pipelines_updated_at ON public.pipelines;
CREATE TRIGGER update_pipelines_updated_at 
BEFORE UPDATE ON public.pipelines 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_stages_updated_at ON public.stages;
CREATE TRIGGER update_stages_updated_at 
BEFORE UPDATE ON public.stages 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cards_updated_at ON public.cards;
CREATE TRIGGER update_cards_updated_at 
BEFORE UPDATE ON public.cards 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();
