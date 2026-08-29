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

const candidates = [
  ['vasanth@gmail.com', 'Password123!'],
  ['vasanthtest@gmail.com', 'Password123!'],
  ['vasanth_test123@gmail.com', 'Password123!'],
]

for (const [email, password] of candidates) {
  const supabase = createClient(url, anon)
  const { data, error } = await supabase.auth.signInWithPassword({ email, password, options: { captchaToken: '1x00000000000000000000AA' } })
  if (error) {
    console.log(email, '=> SIGNIN_ERR:', error.message)
    continue
  }
  const uid = data.user.id
  const { data: row, error: rErr } = await supabase.from('users').select('id, email, full_name, role, is_active').eq('id', uid).maybeSingle()
  console.log(email, '=> OK uid', uid, rErr ? 'ROW_ERR ' + rErr.message : JSON.stringify(row))
  break
}
