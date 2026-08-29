const { createClient } = require('./node_modules/@supabase/supabase-js');

const url = 'https://xbjhlfwqmcyatblsrhxn.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhiamhsZndxbWN5YXRibHNyaHhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMzY1NTUsImV4cCI6MjA5MDcxMjU1NX0.CsZKPu17UgACMzndyd3VznbZW9jzrNbQ_3Xc-AP53nM';

const client = createClient(url, key);

async function test() {
  const ids = ['00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002'];

  console.log('=== TEST A: .not("id", "in", ids) [Array] ===');
  const qA = client.from('questions').select('id').not('id', 'in', ids).limit(1);
  console.log('qA searchParams:', qA.url.searchParams.toString());
  const resA = await qA;
  console.log('resA error:', resA.error);

  console.log('\n=== TEST B: .not("id", "in", `(${ids.join(",")})`) [Formatted String] ===');
  const qB = client.from('questions').select('id').not('id', 'in', `(${ids.join(",")})`).limit(1);
  console.log('qB searchParams:', qB.url.searchParams.toString());
  const resB = await qB;
  console.log('resB error:', resB.error);
  console.log('resB data count:', resB.data ? resB.data.length : null);
}

test().catch(console.error);
