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

const { data: topics, error: te } = await supabase.from('exam_topics')
  .select('*')
  .eq('paper_id', '926c7d30-add2-4d03-a040-f011e9282562')
  .limit(25)
if (te) console.log('TOPICS_ERR', te.message)
else {
  console.log('TOPIC_COLS:', Object.keys(topics[0] ?? {}).join(', '))
  for (const t of topics) console.log(JSON.stringify(t))
}

const { data: sbjTopics, error: st } = await supabase.from('exam_topics')
  .select('subject_name, id')
  .eq('paper_id', '926c7d30-add2-4d03-a040-f011e9282562')
console.log('SUBJ_TOPICS:', st ? 'ERR ' + st.message : JSON.stringify(sbjTopics))
