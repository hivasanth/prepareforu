const fs = require('fs');

const parsed = JSON.parse(fs.readFileSync('c:\\Users\\Vasanth\\Desktop\\PrepareForU\\scratch\\parsed_topics.json', 'utf8'));

// Filter for Group 3
const group3Parsed = parsed.filter(r => r.examName === 'Group 3');

console.log(`Parsed ${group3Parsed.length} topics for Group 3 from logs.`);

// We can output the unique subjects for Group 3
const subjects = [...new Set(group3Parsed.map(r => r.subjectName))];
console.log("Subjects found in parsed Group 3:", subjects);

// Write them to a JSON file to inspect
fs.writeFileSync('c:\\Users\\Vasanth\\Desktop\\PrepareForU\\scratch\\group3_parsed.json', JSON.stringify(group3Parsed, null, 2), 'utf8');
