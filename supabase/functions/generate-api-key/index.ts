import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple hash function (SHA-256) to replace bcrypt
async function hashApiKey(apiKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, rate_limit_per_minute = 60 } = await req.json();

    console.log('Generating API key for:', name);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get user's tenant_id
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No user found');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('User ID:', user.id);

    const { data: userRecord, error: userRecordError } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (userRecordError || !userRecord || !userRecord.tenant_id) {
      console.error('No tenant found for user:', userRecordError);
      return new Response(JSON.stringify({ error: 'No tenant found', details: userRecordError }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const tenantId = userRecord.tenant_id;

    console.log('Tenant ID:', tenantId);

    // Generate random API key
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    const apiKey = 'sk_live_' + Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    console.log('Generated API key:', apiKey.substring(0, 20) + '...');

    // Hash the key using SHA-256
    const keyHash = await hashApiKey(apiKey);
    const keyPrefix = apiKey.substring(0, 15) + '...';

    console.log('Key hash created, prefix:', keyPrefix);

    // Create admin supabase client
    const adminSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Store hashed key in database
    const { data, error } = await adminSupabase
      .from('api_keys')
      .insert({
        tenant_id: tenantId,
        name,
        key_hash: keyHash,
        key_prefix: keyPrefix,
        rate_limit_per_minute,
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    console.log('API key saved successfully:', data.id);

    // Return the plain API key (only time it's shown)
    return new Response(
      JSON.stringify({
        ...data,
        api_key: apiKey, // Plain key for user to copy
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error generating API key:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage, stack: error instanceof Error ? error.stack : undefined }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
