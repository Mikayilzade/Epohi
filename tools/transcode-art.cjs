const fs = require('fs');
const { chromium } = require('playwright');

(async () => {
  const [source, target, size = '512'] = process.argv.slice(2);
  if (!source || !target) throw new Error('Usage: node tools/transcode-art.cjs input.png output.webp [size]');
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const png = fs.readFileSync(source).toString('base64');
    const data = await page.evaluate(async ({ png, size }) => {
      const image = new Image();
      image.src = `data:image/png;base64,${png}`;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = Number(size);
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/webp', .86).split(',')[1];
    }, { png, size });
    fs.writeFileSync(target, Buffer.from(data, 'base64'));
    console.log(`${target}: ${fs.statSync(target).size} bytes`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
