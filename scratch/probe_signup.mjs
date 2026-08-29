import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const env = readFileSync('.env', 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(\S+)/)?.[1];
const key = env.match(/VITE_SUPABASE_ANON_KEY=(\S+)/)?.[1];
const supabase = createClient(url, key);

const stamp = Date.now().toString().slice(-6);
const email = `skelperf${stamp}@gmail.com`;
const { data, error } = await supabase.auth.signUp({
  email,
  password: 'Password123!',
  options: {
    captchaToken: '1x00000000000000000000AA',
    data: { full_name: 'Skel Perf', exam_selection: 'APPSC_GROUPS' },
  },
});
console.log(email, '=> session?', !!data?.session, 'user?', !!data?.user, 'err?', error?.message ?? 'none');
console.log('identities?', JSON.stringify(data?.user?.identities ?? []));
