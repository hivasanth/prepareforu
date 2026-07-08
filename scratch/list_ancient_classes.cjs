const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\Vasanth\\Desktop\\PrepareForU\\src\\index.css', 'utf8');
const lines = content.split('\n');
let insideAncient = false;
let bracketCount = 0;
let currentBlock = [];

lines.forEach((line, index) => {
    if (line.includes('.ancient-') && line.includes('{')) {
        insideAncient = true;
        bracketCount = 0;
        currentBlock = [];
    }
    if (insideAncient) {
        currentBlock.push(`${index + 1}: ${line.trim()}`);
        if (line.includes('{')) bracketCount++;
        if (line.includes('}')) bracketCount--;
        if (bracketCount === 0) {
            insideAncient = false;
            console.log(currentBlock.join('\n'));
            console.log('---');
        }
    }
});
