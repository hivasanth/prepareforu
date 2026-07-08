import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://zltqxtrvwukqckmubskv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsdHF4dHJ2d3VrcWNrbXVic2t2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTMyMDUzMDYsImV4cCI6MjAyODc4MTMwNn0.8-v6-v-v-v-v-v-v-v-v-v-v-v-v-v-v-v-v-v-v-v' // I don't have the real key here, but I can't run this anyway without it.
)

async function check() {
  const { data, error } = await supabase.from('exam_subjects').select('*').limit(1)
  console.log({ data, error })
}
check()
