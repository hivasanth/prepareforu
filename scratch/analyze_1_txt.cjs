const fs = require('fs');

try {
  let content = fs.readFileSync('c:\\Users\\Vasanth\\Desktop\\1.txt', 'utf8');
  content = content.replace(/^\uFEFF/, '');
  const data = JSON.parse(content);
  console.log(`1.txt contains ${data.length} questions.`);
  
  const subjects = {};
  const topics = {};
  
  data.forEach((q, idx) => {
    const s = q.subject_name || 'NULL';
    const t = q.topic_en || 'NULL';
    subjects[s] = (subjects[s] || 0) + 1;
    topics[t] = (topics[t] || 0) + 1;
    
    if (idx < 5) {
      console.log(`Sample ${idx}: Subject: ${s}, Topic: ${t}`);
    }
  });
  
  console.log("Subjects in 1.txt:", subjects);
  console.log("Unique Topics count:", Object.keys(topics).length);
} catch (err) {
  console.error("Error parsing 1.txt:", err.message);
}
