const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const pngToIco = require('png-to-ico');

async function run() {
  const appDir = path.join(__dirname, '..', 'app');
  const publicDir = path.join(__dirname, '..', 'public');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir);

  const svgPath = path.join(appDir, 'favicon.svg');
  if (!fs.existsSync(svgPath)) {
    console.error('app/favicon.svg not found');
    process.exit(1);
  }

  const sizes = [16, 32, 48, 64, 128];
  const pngPaths = [];
  for (const size of sizes) {
    const out = path.join(publicDir, `favicon-${size}.png`);
    await sharp(svgPath).resize(size, size).png().toFile(out);
    pngPaths.push(out);
    console.log('Wrote', out);
  }

  const icoPath = path.join(publicDir, 'favicon.ico');
  const buf = await pngToIco(pngPaths);
  fs.writeFileSync(icoPath, buf);
  console.log('Wrote', icoPath);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
