const fs = require('fs');
const path = require('path');

const searchDir = 'c:\\Users\\Vasanth\\Desktop\\PrepareForU';
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
            if (ext === '.css' || ext === '.ts' || ext === '.tsx') {
                try {
                    const content = fs.readFileSync(filePath, 'utf8');
                    if (content.includes('ancient-sidebar')) {
                        results.push(filePath);
                    }
                } catch (e) {}
            }
        }
    });
}

walk(searchDir);
console.log('Files with ancient-sidebar:', results);
