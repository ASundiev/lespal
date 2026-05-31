import { createClient } from '@supabase/supabase-js';

const directSupabaseUrl = 'https://odhkokbxpaolreqylvsf.supabase.co';
const proxiedSupabaseUrl = 'https://94-72-103-203.sslip.io/supabase';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kaGtva2J4cGFvbHJlcXlsdnNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5ODI5NDMsImV4cCI6MjA4MTU1ODk0M30.1JvfPnzlpMqHgWKdUxLDxVI2y8B3Wya3LongdemA8mA';

// Supabase's *.supabase.co endpoint can be unreachable from some networks.
// Keep the client URL on an HTTPS reverse proxy owned by Lespal's VPS; Caddy
// strips /supabase and forwards to directSupabaseUrl so Auth, REST, and RLS
// still behave exactly like the original Supabase project.
const supabaseUrl = proxiedSupabaseUrl;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export { directSupabaseUrl, proxiedSupabaseUrl };
