import { chromium } from '/Users/parthagrawal99/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 560, height: 900 } })
await page.goto(`file://${process.cwd()}/captions.html`)
await page.evaluate(() => document.fonts.ready)
await page.screenshot({ path: 'captions.png', fullPage: true })
await browser.close()
console.log('shot')
