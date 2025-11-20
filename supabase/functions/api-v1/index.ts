import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
};

// Types
interface ApiContext {
  tenantId: string;
  apiKeyId: string;
  supabase: any;
}

interface PaginationParams {
  limit: number;
  cursor?: string;
}

interface FilterParams {
  [key: string]: any;
}

// Helper: Authenticate request
async function authenticate(req: Request, supabase: any): Promise<ApiContext | null> {
  const apiKey = req.headers.get('x-api-key');
  
  if (!apiKey) {
    return null;
  }

  // Verify API key using bcrypt comparison in database
  const { data: keyData, error } = await supabase.rpc('verify_api_key', {
    p_api_key: apiKey
  });

  if (error || !keyData || keyData.length === 0) {
    console.error('API key verification failed:', error);
    return null;
  }

  const apiKeyRecord = keyData[0];

  // Check if key is active and not expired
  if (!apiKeyRecord.is_active) {
    return null;
  }

  if (apiKeyRecord.expires_at && new Date(apiKeyRecord.expires_at) < new Date()) {
    return null;
  }

  // Update last_used_at
  await supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', apiKeyRecord.id);

  return {
    tenantId: apiKeyRecord.tenant_id,
    apiKeyId: apiKeyRecord.id,
    supabase
  };
}

// Helper: Parse pagination params
function parsePagination(url: URL): PaginationParams {
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
  const cursor = url.searchParams.get('cursor') || undefined;
  
  return { limit, cursor };
}

// Helper: Parse filters
function parseFilters(url: URL): FilterParams {
  const filters: FilterParams = {};
  const params = url.searchParams;

  for (const [key, value] of params.entries()) {
    if (!['limit', 'cursor', 'include'].includes(key)) {
      // Support custom_fields filtering with dot notation
      if (key.startsWith('custom_fields.')) {
        const fieldName = key.substring('custom_fields.'.length);
        filters[`custom_fields->${fieldName}`] = value;
      } else {
        filters[key] = value;
      }
    }
  }

  return filters;
}

// Helper: Build query with filters
function applyFilters(query: any, filters: FilterParams) {
  for (const [key, value] of Object.entries(filters)) {
    if (key.includes('->')) {
      // JSONB field
      query = query.filter(key, 'eq', value);
    } else if (key.endsWith('_gte')) {
      query = query.gte(key.replace('_gte', ''), value);
    } else if (key.endsWith('_lte')) {
      query = query.lte(key.replace('_lte', ''), value);
    } else if (key.endsWith('_like')) {
      query = query.ilike(key.replace('_like', ''), `%${value}%`);
    } else {
      query = query.eq(key, value);
    }
  }
  return query;
}

// Helper: Apply includes (relationships)
function parseIncludes(url: URL): string[] {
  const include = url.searchParams.get('include');
  return include ? include.split(',').map(i => i.trim()) : [];
}

// Helper: Trigger webhooks
async function triggerWebhooks(
  supabase: any,
  tenantId: string,
  eventType: string,
  payload: any
) {
  try {
    const { data: webhooks } = await supabase
      .from('webhooks')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .contains('events', [eventType]);

    if (!webhooks || webhooks.length === 0) return;

    // Trigger webhooks asynchronously
    for (const webhook of webhooks) {
      const signature = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(webhook.secret + JSON.stringify(payload))
      );
      const signatureHex = Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signatureHex,
          'X-Event-Type': eventType,
        },
        body: JSON.stringify(payload),
      })
        .then(async (response) => {
          await supabase.from('webhook_logs').insert({
            webhook_id: webhook.id,
            event_type: eventType,
            payload,
            response_status: response.status,
            response_body: await response.text(),
          });
        })
        .catch(async (error) => {
          await supabase.from('webhook_logs').insert({
            webhook_id: webhook.id,
            event_type: eventType,
            payload,
            response_status: 0,
            response_body: error.message,
          });
        });
    }
  } catch (error) {
    console.error('Error triggering webhooks:', error);
  }
}

// Helper: Format response with metadata
function formatResponse(data: any, pagination?: any, links?: any) {
  return {
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...(pagination && { pagination }),
    },
    ...(links && { links }),
  };
}

// CRUD Handlers for each entity
async function handleContacts(
  req: Request,
  ctx: ApiContext,
  path: string[]
): Promise<Response> {
  const url = new URL(req.url);
  const method = req.method;
  const id = path[1]; // /contacts/:id

  // GET /v1/contacts or /v1/contacts/:id
  if (method === 'GET') {
    if (id) {
      // Get single contact
      const { data, error } = await ctx.supabase
        .from('contacts')
        .select('*')
        .eq('tenant_id', ctx.tenantId)
        .eq('id', id)
        .single();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify(formatResponse(data)), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      // List contacts with filters and pagination
      const pagination = parsePagination(url);
      const filters = parseFilters(url);

      let query = ctx.supabase
        .from('contacts')
        .select('*', { count: 'exact' })
        .eq('tenant_id', ctx.tenantId)
        .order('created_at', { ascending: false })
        .limit(pagination.limit);

      query = applyFilters(query, filters);

      if (pagination.cursor) {
        query = query.lt('created_at', pagination.cursor);
      }

      const { data, error, count } = await query;

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const nextCursor = data.length === pagination.limit ? data[data.length - 1].created_at : null;

      return new Response(
        JSON.stringify(
          formatResponse(data, {
            total: count,
            limit: pagination.limit,
            next_cursor: nextCursor,
          })
        ),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  }

  // POST /v1/contacts
  if (method === 'POST') {
    const body = await req.json();
    
    const { data, error } = await ctx.supabase
      .from('contacts')
      .insert({ ...body, tenant_id: ctx.tenantId })
      .select()
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Trigger webhook
    await triggerWebhooks(ctx.supabase, ctx.tenantId, 'contact.created', data);

    return new Response(JSON.stringify(formatResponse(data)), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // PUT/PATCH /v1/contacts/:id
  if ((method === 'PUT' || method === 'PATCH') && id) {
    const body = await req.json();

    const { data, error } = await ctx.supabase
      .from('contacts')
      .update(body)
      .eq('tenant_id', ctx.tenantId)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    await triggerWebhooks(ctx.supabase, ctx.tenantId, 'contact.updated', data);

    return new Response(JSON.stringify(formatResponse(data)), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // DELETE /v1/contacts/:id
  if (method === 'DELETE' && id) {
    const { error } = await ctx.supabase
      .from('contacts')
      .delete()
      .eq('tenant_id', ctx.tenantId)
      .eq('id', id);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    await triggerWebhooks(ctx.supabase, ctx.tenantId, 'contact.deleted', { id });

    return new Response(null, { status: 204, headers: corsHeaders });
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Similar handlers for other entities (products, appointments, tasks, etc.)
// Following the same pattern...

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    // Authenticate
    const ctx = await authenticate(req, supabase);
    
    if (!ctx) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse URL
    const url = new URL(req.url);
    const segments = url.pathname.split('/').filter(Boolean);
    const apiIndex = segments.indexOf('api-v1');
    const path = apiIndex >= 0 ? segments.slice(apiIndex + 1) : segments;

    // Route to appropriate handler - path is now ["contacts"] or ["contacts", "id"]
    if (!path[0]) {
      return new Response(JSON.stringify({ error: 'Resource not specified' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const resource = path[0];
    let response: Response;

    switch (resource) {
      case 'contacts':
        response = await handleContacts(req, ctx, path);
        break;
      // Add other resources here
      default:
        response = new Response(JSON.stringify({ error: 'Resource not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // Log request
    const responseTime = Date.now() - startTime;
    await supabase.from('api_logs').insert({
      tenant_id: ctx.tenantId,
      api_key_id: ctx.apiKeyId,
      method: req.method,
      path: url.pathname,
      status_code: response.status,
      response_time_ms: responseTime,
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
      user_agent: req.headers.get('user-agent') || 'unknown',
    });

    return response;
  } catch (error) {
    console.error('API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
