const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const themes = [
  'default',
  'dark',
  'dark-neutral',
  'hacker',
  'solarized-dark',
  'solarized-light',
  'sepia',
  'nord',
  'dracula',
  'high-contrast-dark',
  'high-contrast-light'
];

const pages = [
  { name: 'home', path: '/es' },
  { name: 'post', path: '/es/posts/nuevo-post-de-prueba' },
  { name: 'subs', path: '/es/s' },
  { name: 'activity', path: '/es/activity' },
  { name: 'login', path: '/es/auth/login' },
];

async function takeScreenshots() {
  const outputDir = path.join(__dirname, '../theme-screenshots');

  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const baseUrl = 'http://localhost:3000';

  for (const theme of themes) {
    console.log(`\n📸 Capturing theme: ${theme}`);

    for (const pageInfo of pages) {
      const url = `${baseUrl}${pageInfo.path}?theme=${theme}`;
      const filename = `${theme}-${pageInfo.name}.png`;

      try {
        console.log(`  → ${pageInfo.name}...`);
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

        // Wait a bit for any animations
        await new Promise(r => setTimeout(r, 500));

        await page.screenshot({
          path: path.join(outputDir, filename),
          fullPage: false
        });

        console.log(`    ✓ Saved: ${filename}`);
      } catch (error) {
        console.error(`    ✗ Error on ${pageInfo.name}: ${error.message}`);
      }
    }
  }

  await browser.close();
  console.log(`\n✅ Screenshots saved to: ${outputDir}`);
}

takeScreenshots().catch(console.error);
