const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const destDir = path.join(rootDir, 'www');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const filesToCopy = [
  'index.html',
  'styles.css',
  'app.js',
  'cs-widget.js',
  'manifest.json',
  'favicon.svg'
];

for (const file of filesToCopy) {
  const src = path.join(rootDir, file);
  const dest = path.join(destDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`Copied: ${file} -> www/${file}`);
  }
}

// Copy assets directory recursively
const copyDirRecursive = (src, dest) => {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
};

copyDirRecursive(path.join(rootDir, 'assets'), path.join(destDir, 'assets'));
console.log('Copied assets/ -> www/assets/');
console.log('Build to www/ complete!');
