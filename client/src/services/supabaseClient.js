import { createClient } from '@supabase/supabase-js';
import { env } from '../utils/env.js';

export const supabaseClient = createClient(
  env.supabaseUrl,
  env.supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  },
);
