import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const fields = ['utm_source','utm_medium','utm_campaign','utm_term','utm_content','gclid','gbraid','wbraid','landing_page','submission_page']

function walk(dir) {
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(full))
    else if (entry.isFile() && entry.name.endsWith('.html')) out.push(full)
  }
  return out
}

for (const file of walk(root)) {
  let html = fs.readFileSync(file, 'utf8')
  let changed = false
  let cursor = 0
  while (true) {
    const start = html.indexOf('<form', cursor)
    if (start < 0) break
    const tagEnd = html.indexOf('>', start)
    const close = html.indexOf('</form>', tagEnd)
    if (tagEnd < 0 || close < 0) break
    const tag = html.slice(start, tagEnd + 1)
    const body = html.slice(tagEnd + 1, close)
    if (/name\s*=\s*["']financing-review["']/i.test(tag) && /data-netlify/i.test(tag)) {
      const missing = fields.filter((name) => !new RegExp(`name=["']${name}["']`, 'i').test(body))
      if (missing.length) {
        const hidden = missing.map((name) => `<input type="hidden" name="${name}" value="" />`).join('')
        html = html.slice(0, tagEnd + 1) + hidden + html.slice(tagEnd + 1)
        cursor = close + hidden.length + 7
        changed = true
        continue
      }
    }
    cursor = close + 7
  }
  if (changed) fs.writeFileSync(file, html)
}

console.log('BelAirFinancing attribution fields registered.')
