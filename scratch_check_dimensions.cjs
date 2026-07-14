const fs = require('fs');
const path = require('path');

const dir = 'c:/laragon/www/kerja/booth/src/assets/pnc';
const files = fs.readdirSync(dir);

console.log('Filename | Width | Height | Aspect Ratio');
console.log('---|---|---|---');

files.forEach(file => {
  if (!file.endsWith('.png')) return;
  const filePath = path.join(dir, file);
  const buffer = fs.readFileSync(filePath);
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  const ratio = (width / height).toFixed(3);
  console.log(`${file} | ${width}px | ${height}px | ${ratio}`);
});
