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

const { data: q, error: qe } = await supabase.from('questions')
  .select('*')
  .eq('paper_id', '926c7d30-add2-4d03-a040-f011e9282562')
  .eq('subject_name', 'History and Culture')
  .limit(1)
  .maybeSingle()
if (qe) console.log('Q_ERR', qe.message)
else console.log('SAMPLE Q:', JSON.stringify(q, null, 1))

const { data: topics, error: te } = await supabase.from('exam_topics')
  .select('exam_id, paper_id, subject_name, topic_name')
  .eq('paper_id', '926c7d30-add2-4d03-a040-f011e9282562')
  .limit(30)
console.log('TOPICS:', te ? 'ERR ' + te.message : JSON.stringify(topics))

const { count, error: ce } = await supabase.from('exam_topics')
  .select('*', { count: 'exact', head: true })
  .eq('paper_id', '926c7d30-add2-4d03-a040-f011e9282562')
console.log('TOPIC_COUNT:', count, ce?.message ?? '')

const { data: subCols, error: sc } = await supabase.from('questions').select('paper_id, subject_name').eq('paper_id', '926c7d30-add2-4d03-a040-f011e9282562')
console.log('Q_DISTINCT_COLS:', sc ? 'ERR ' + sc.message : JSON.stringify(subCols?.slice(0, 3)))
