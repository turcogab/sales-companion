import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zipqraqiztulxyuzhtjo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppcHFyYXFpenR1bHh5dXpodGpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMTY5OTcsImV4cCI6MjA4Mzg5Mjk5N30.8xzsQJGwQSo7wkwCl1nFWlBAxRlKAg7BYMrPCwdnAd4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export { SUPABASE_URL, SUPABASE_ANON_KEY };
