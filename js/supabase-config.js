/* UniTrack — Supabase Configuration
   Replace these with your Supabase project credentials.
   Find them at: https://supabase.com/dashboard → Project → Settings → API */

const SUPABASE_URL = 'https://nlghhscykwhgzlkvpxus.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ZqHHgr_4QD44txZjxWWC4g_I6-vAAgz';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
