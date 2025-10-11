const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'backend', 'src', 'prompts', 'language-templates.ts');

console.log('Escaping backticks in:', filePath);

let content = fs.readFileSync(filePath, 'utf8');

// Count existing escaped backticks
const escapedCount = (content.match(/\\`\\`\\`/g) || []).length;
console.log(`Found ${escapedCount} already escaped backtick blocks`);

// Escape triple backticks that are NOT already escaped
// Simple approach: replace all ``` with \`\`\`
let escaped = 0;
content = content.replace(/```/g, (match, offset) => {
  // Check if already escaped (preceded by backslash)
  if (offset > 0 && content[offset - 1] === '\\') {
    return match; // Already escaped
  }
  escaped++;
  return '\\`\\`\\`';
});

fs.writeFileSync(filePath, content, 'utf8');

console.log(`✅ Done! Escaped ${escaped} backtick blocks.`);
