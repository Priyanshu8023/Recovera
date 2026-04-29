const fs = require('fs');
const path = require('path');
function walk(dir) {
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) walk(filePath);
    else if (filePath.endsWith('.ts')) {
      let content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('\\${')) {
        content = content.replace(/\\\${/g, '${');
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed \\${ in:', filePath);
      }
    }
  });
}
walk('c:/Users/Priyanshu/Desktop/Recovera/client/Agentic-AI');
