import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const env = readFileSync('.env', 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(\S+)/)?.[1];
const key = env.match(/VITE_SUPABASE_ANON_KEY=(\S+)/)?.[1];
const supabase = createClient(url, key);

for (const email of ['vasanth_test123@gmail.com', 'vasanth@gmail.com', 'vasanthtest@gmail.com']) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: 'Password123!',
    options: { captchaToken: '1x00000000000000000000AA' },
  });
  console.log(email, '=> session?', !!data?.session, 'err?', error?.message ?? 'none');
}
