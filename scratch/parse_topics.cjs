const fs = require('fs');

const fileContent = fs.readFileSync('c:\\Users\\Vasanth\\Desktop\\PrepareForU\\scratch\\user_requests_all.txt', 'utf8');
const lines = fileContent.split('\n').map(l => l.trim());

let index = 0;
const records = [];

// Helper to find start of table
while (index < lines.length) {
  if (lines[index] === 'S.No' && lines[index+1] === 'Exam Type') {
    index += 7; // skip headers
    break;
  }
  index++;
}

while (index < lines.length) {
  if (!lines[index]) {
    index++;
    continue;
  }
  
  // If we encounter a new header block, skip it
  if (lines[index] === 'S.No' && lines[index+1] === 'Exam Type') {
    index += 7;
    continue;
  }
  
  // Parse a record of 7 lines
  const sno = lines[index];
  const examType = lines[index+1];
  const examName = lines[index+2];
  const paperName = lines[index+3];
  const subjectName = lines[index+4];
  const topicEn = lines[index+5];
  const topicTe = lines[index+6];
  
  if (sno && examType && examName && paperName && subjectName && topicEn) {
    records.push({
      sno,
      examType,
      examName,
      paperName,
      subjectName,
      topicEn,
      topicTe: (topicTe === '—' || topicTe === 'null' || !topicTe) ? null : topicTe
    });
    index += 7;
  } else {
    // If it doesn't match a full 7-line record, just advance 1 line to find next
    index++;
  }
}

console.log(`Parsed ${records.length} records.`);

// Group by examName
const grouped = {};
records.forEach(r => {
  if (!grouped[r.examName]) grouped[r.examName] = [];
  grouped[r.examName].push(r);
});

Object.keys(grouped).forEach(exam => {
  console.log(`Exam: ${exam} - ${grouped[exam].length} topics`);
  // Print unique subjects and papers
  const papers = new Set(grouped[exam].map(r => r.paperName));
  const subjects = new Set(grouped[exam].map(r => r.subjectName));
  console.log(`  Papers:`, Array.from(papers));
  console.log(`  Subjects:`, Array.from(subjects));
});

// Let's write them all to a JSON file to inspect
fs.writeFileSync('c:\\Users\\Vasanth\\Desktop\\PrepareForU\\scratch\\parsed_topics.json', JSON.stringify(records, null, 2), 'utf8');
