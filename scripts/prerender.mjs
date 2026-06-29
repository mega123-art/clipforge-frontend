// Injects prerendered Landing HTML into dist/index.html so crawlers get real
// content for the public "/" route. Client createRoot re-renders on mount.
import { readFileSync, writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

// Browser globals the store touches at import time (zustand persist / theme).
const mem = new Map()
globalThis.localStorage ??= {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: (k) => mem.delete(k),
  clear: () => mem.clear(),
}
globalThis.matchMedia ??= () => ({ matches: false, addEventListener() {}, removeEventListener() {} })
globalThis.document ??= {
  documentElement: { classList: { add() {}, remove() {}, toggle() {}, contains: () => false } },
}

const { render } = await import(pathToFileURL('./dist-ssr/prerender.mjs').href)
const html = render()

const indexPath = './dist/index.html'
const index = readFileSync(indexPath, 'utf8')

if (!index.includes('<div id="root"></div>')) {
  throw new Error('prerender: <div id="root"></div> not found in dist/index.html')
}

const out = index.replace('<div id="root"></div>', `<div id="root">${html}</div>`)
writeFileSync(indexPath, out)
console.log(`prerender: injected ${html.length} bytes into dist/index.html`)
