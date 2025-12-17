import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://odhkokbxpaolreqylvsf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kaGtva2J4cGFvbHJlcXlsdnNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5ODI5NDMsImV4cCI6MjA4MTU1ODk0M30.1JvfPnzlpMqHgWKdUxLDxVI2y8B3Wya3LongdemA8mA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
