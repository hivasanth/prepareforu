import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { readFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read .env directly
const envPath = resolve(__dirname, '.env');
const envContent = readFileSync(envPath, 'utf-8');

const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1]] = match[2].trim().replace(/^["'](.*)["']$/, '$1');
  }
});

import { createClient } from '@supabase/supabase-js';
const supabase = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_ANON_KEY']);

async function check() {
  const { data: exams } = await supabase.from('exam_papers').select('exam_id');
  console.log('Distinct exams in exam_papers:', [...new Set(exams?.map(d => d.exam_id) || [])]);
  
  const { data: q } = await supabase.from('questions').select('exam_id');
  console.log('Distinct exams in questions:', [...new Set(q?.map(d => d.exam_id) || [])]);
}
check();
