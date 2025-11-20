import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

// This is a database function helper for verifying API keys
// Called via RPC from the main API

serve(async (req) => {
  try {
    const { api_key } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get all active API keys (we'll verify hash in memory)
    const { data: keys, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;

    // Find matching key by comparing hashes
    for (const key of keys) {
      const isValid = await bcrypt.compare(api_key, key.key_hash);
      if (isValid) {
        return new Response(JSON.stringify([key]), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify([]), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
