const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\Vasanth\\Desktop\\PrepareForU\\src\\layouts\\AdminLayout.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, index) => {
    if (line.includes('<aside') || line.includes('aside') || line.includes('className') && (line.includes('bg-') || line.includes('style='))) {
        if (index > 120 && index < 150) {
            console.log(`${index + 1}: ${line.trim()}`);
        }
    }
});
