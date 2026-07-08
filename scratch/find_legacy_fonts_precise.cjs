const fs = require('fs');
const path = require('path');

const searchDir = 'c:\\Users\\Vasanth\\Desktop\\PrepareForU';
const extensions = [".ts", ".tsx", ".css", ".html", ".js", ".jsx"];

// regex with boundaries
const fontRegex = /\b(cinzel|syne|poppins|dm[- ]sans|outfit)\b/i;
// Let's check "inter" carefully as well, but avoiding matching words like "interface", "internet", "interval", "interrupted"
const interRegex = /\binter\b/i; 

const results = [];

function walk(dir) {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            if (file !== 'node_modules' && file !== 'dist' && file !== '.git' && file !== 'brain' && file !== '.vscode' && file !== 'scratch') {
                walk(filePath);
            }
        } else {
            const ext = path.extname(file).toLowerCase();
            if (extensions.includes(ext)) {
                try {
                    const content = fs.readFileSync(filePath, 'utf8');
                    const lines = content.split('\n');
                    lines.forEach((line, index) => {
                        if (fontRegex.test(line) || interRegex.test(line)) {
                            // Filter out common false positives for inter in code (like interface, interval, etc)
                            const lowerLine = line.toLowerCase();
                            // If it matches inter but only as part of interface/internet/interval/interrupted/internal/intersection/interactive etc.
                            // The \binter\b regex already handles word boundaries, so "interface" won't match \binter\b.
                            // But let's verify if there are any matches.
                            results.push(`${filePath}:${index + 1}: ${line.strip ? line.strip() : line.trim()}`);
                        }
                    });
                } catch (e) {
                    // Ignore read errors
                }
            }
        }
    });
}

walk(searchDir);

console.log(`Found ${results.length} precise legacy font matches:`);
results.forEach(r => console.log(r));
