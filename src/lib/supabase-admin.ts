import { createClient } from '@supabase/supabase-js';

// Server-side only client that bypasses RLS for inserting data
// We use placeholder strings so Vercel's build doesn't crash if env vars are not loaded during build time
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder';

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
