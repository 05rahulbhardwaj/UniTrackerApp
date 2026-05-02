/* UniTrack — Supabase Configuration
   Replace these with your Supabase project credentials.
   Find them at: https://supabase.com/dashboard → Project → Settings → API */

const SUPABASE_URL = 'https://nlghhscykwhgzlkvpxus.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sZ2hoc2N5a3doZ3psa3ZweHVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MTIxMzYsImV4cCI6MjA5MzI4ODEzNn0.7yv9pjv6Niu2Q1ojlFktWPcqBkZtmR4VbQF9ZODqQso';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
