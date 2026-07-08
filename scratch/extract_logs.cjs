const fs = require('fs');
const path = require('path');

const logFile = "C:\\Users\\Vasanth\\.gemini\\antigravity-ide\\brain\\1ec75044-6ea7-4580-9f6e-524457d7dfab\\.system_generated\\logs\\transcript_full.jsonl";
const outputFile = "c:\\Users\\Vasanth\\Desktop\\PrepareForU\\scratch\\user_requests_all.txt";

try {
  const content = fs.readFileSync(logFile, 'utf8');
  const lines = content.split('\n');
  const outContent = [];

  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    try {
      const obj = JSON.parse(lines[i]);
      if (obj.type === 'USER_INPUT') {
        outContent.push(`=== STEP ${obj.step_index} ===`);
        outContent.push(obj.content);
        outContent.push("\n" + "=".repeat(50) + "\n");
      }
    } catch (e) {
      console.error(`Error parsing line ${i}:`, e.message);
    }
  }

  fs.writeFileSync(outputFile, outContent.join('\n'), 'utf8');
  console.log(`Successfully wrote user requests to ${outputFile}`);
} catch (err) {
  console.error("Error reading/writing:", err.message);
}
