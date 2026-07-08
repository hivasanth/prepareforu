const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\Vasanth\\Desktop\\PrepareForU\\src\\index.css', 'utf8');
const lines = content.split('\n');
lines.forEach((line, index) => {
    if (line.includes('ancient-sidebar')) {
        console.log(`${index + 1}: ${line.trim()}`);
    }
});
