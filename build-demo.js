const fs = require('fs');
const path = require('path');

let html = fs.readFileSync('src/index.html', 'utf8');
const css = fs.readFileSync('src/css/style.css', 'utf8');
const js = fs.readFileSync('src/js/app.js', 'utf8');

// Inline CSS
html = html.replace('<link rel="stylesheet" href="css/style.css">', '<style>' + css + '</style>');

// Convert images to base64
function inlineImages(dir, urlPrefix) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).filter(f => f.endsWith('.jpg')).forEach(f => {
    const b64 = fs.readFileSync(path.join(dir, f)).toString('base64');
    html = html.split(urlPrefix + f).join('data:image/jpeg;base64,' + b64);
  });
}

inlineImages('src/images/products', '/images/products/');
inlineImages('src/images/slider', '/images/slider/');
inlineImages('src/images/blog', '/images/blog/');

// Inline JS
html = html.replace('<script src="js/app.js"></script>', '<script>' + js + '</script>');

const outPath = 'c:/Users/PC/Desktop/hello-cake-demo.html';
fs.writeFileSync(outPath, html);
console.log('Done! Size: ' + (html.length / 1024 / 1024).toFixed(1) + 'MB');
console.log('File: ' + outPath);
