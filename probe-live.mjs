import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import path from 'node:path'

const envPath = path.resolve('C:/Users/Vasanth/Desktop/PrepareForU/.env')
const env = Object.fromEntries(
  fs.readFileSync(envPath, 'utf8').split(/\r?\n/).filter(Boolean).map(l => {
    const i = l.indexOf('=')
    return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
  })
)
const url = env.VITE_SUPABASE_URL
const anon = env.VITE_SUPABASE_ANON_KEY

const state = JSON.parse(fs.readFileSync('C:/Users/Vasanth/AppData/Local/Temp/opencode/pfu_state.json', 'utf8'))
const authTokenRaw = state.origins[0].localStorage.find(e => e.name.includes('auth-token')).value
const authToken = JSON.parse(authTokenRaw)

const supabase = createClient(url, anon)
await supabase.auth.setSession({
  access_token: authToken.access_token,
  refresh_token: authToken.refresh_token,
})

const { data: me } = await supabase.auth.getUser()
const uid = me?.user?.id
console.log('UID:', uid)

const { data: userRow, error: uErr } = await supabase.from('users').select('id, email, full_name, role, is_active, sub_admin_id, educator_id').maybeSingle()
console.log('USER ROW:', uErr ? 'ERR ' + uErr.message : JSON.stringify(userRow))

const { data: admins, error: aErr } = await supabase.from('users').select('email, full_name, role').in('role', ['admin', 'sub_admin']).limit(20)
console.log('ADMINS:', aErr ? 'ERR ' + aErr.message : JSON.stringify(admins))

const { data: qMeta, error: qmErr } = await supabase.from('questions').select('subject_name, difficulty, is_active, created_by, created_at').limit(6)
console.log('QUESTION META:', qmErr ? 'ERR ' + qmErr.message : JSON.stringify(qMeta))

const { data: subjectsG1, error: sgErr } = await supabase.from('exam_subjects').select('id, subject_name, question_count').eq('paper_id', '926c7d30-add2-4d03-a040-f011e9282562')
console.log('G1 GS SUBJECTS:', sgErr ? 'ERR ' + sgErr.message : JSON.stringify(subjectsG1))

for (const sub of ['Constitution, Polity, Social Justice and International Relations', 'Indian and Andhra Pradesh Economy and Planning', 'Geography', 'History and Culture']) {
  const { count, error } = await supabase.from('questions').select('*', { count: 'exact', head: true })
    .eq('paper_id', '926c7d30-add2-4d03-a040-f011e9282562').eq('subject_name', sub).eq('is_active', true)
  console.log('COUNT', sub, '=', count, error?.message ?? '')
}
