const fs = require('fs');
const path = require('path');

const searchDir = 'c:\\Users\\Vasanth\\Desktop\\PrepareForU';
const legacyFonts = ["cinzel", "syne", "poppins", "dm sans", "inter", "outfit"];
const extensions = [".ts", ".tsx", ".css", ".html", ".js", ".jsx"];

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
                    const contentLower = content.toLowerCase();
                    legacyFonts.forEach(font => {
                        if (contentLower.includes(font)) {
                            const lines = content.split('\n');
                            lines.forEach((line, index) => {
                                if (line.toLowerCase().includes(font)) {
                                    results.push(`${filePath}:${index + 1}: ${line.trim()}`);
                                }
                            });
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

console.log(`Found ${results.length} legacy font matches:`);
results.forEach(r => console.log(r));
