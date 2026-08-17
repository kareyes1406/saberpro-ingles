const fs = require('fs');

let content = fs.readFileSync('questions/part2-matching.js', 'utf8');

const regex = /definition:\s*'.*?',(\s+)correctIndex:\s*(\d+),(\s+)correctWord:\s*'(.*?)',(\s+)explanation:\s*'(.*?)\(.*?\) es/g;

content = content.replace(regex, (match, p1, p2, p3, p4, p5, p6) => {
    // The explanation is something like: '\'Knife\' (cuchillo) es...'
    const extractRegex = /\\'(.*?)\\' \((.*?)\)/;
    const extracted = p6.match(extractRegex);
    if (extracted) {
        let spanish = extracted[2].split('/')[0].trim(); // handle "odontólogo/dentista" -> "odontólogo"
        spanish = spanish.charAt(0).toUpperCase() + spanish.slice(1);
        return `definition: '${spanish}',${p1}correctIndex: ${p2},${p3}correctWord: '${p4}',${p5}explanation: '${p6} es`;
    }
    return match;
});

fs.writeFileSync('questions/part2-matching.js', content, 'utf8');
console.log('Replaced definitions with Spanish translations.');
