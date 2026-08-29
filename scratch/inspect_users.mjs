import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const env = readFileSync('.env', 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(\S+)/)?.[1];
const key = env.match(/VITE_SUPABASE_ANON_KEY=(\S+)/)?.[1];
const supabase = createClient(url, key);

const { data: users, error } = await supabase
  .from('users')
  .select('id, email, full_name, role, exam_selection, sub_admin_id, educator_id, is_active, email_verified, coupon_code_used, created_at')
  .order('created_at', { ascending: false })
  .limit(60);

console.log('USERS_ERR', error?.message ?? 'none');
console.log('USERS_COUNT', users?.length ?? 0);
for (const u of users ?? []) {
  console.log(JSON.stringify({
    email: u.email,
    name: u.full_name,
    role: u.role,
    exam_selection: u.exam_selection,
    coupon_code_used: u.coupon_code_used,
    sub_admin_id: u.sub_admin_id,
    educator_id: u.educator_id,
    is_active: u.is_active,
    email_verified: u.email_verified,
    id: u.id,
  }));
}
