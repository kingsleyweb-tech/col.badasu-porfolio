// Security test for the portfolio access control. Runs against the dev server on :5287 wired to the
// Firebase emulators (Auth :9099, Firestore :8089). Uses only a test admin created in the emulator.
import { readFileSync } from 'node:fs'
import { initializeApp as initClient } from 'firebase/app'
import { getFirestore as clientDb, connectFirestoreEmulator, doc as cdoc, getDoc as cget } from 'firebase/firestore'

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8089'
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099'
const { initializeApp } = await import('firebase-admin/app')
const { getFirestore } = await import('firebase-admin/firestore')
const { getAuth } = await import('firebase-admin/auth')

const env = Object.fromEntries(readFileSync('.env', 'utf8').split(/\r?\n/).filter((l) => l.includes('=') && !l.startsWith('#')).map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]))
const admin = JSON.parse(readFileSync(process.env.ADMIN_FILE, 'utf8'))
const adminApp = initializeApp({ projectId: env.VITE_FIREBASE_PROJECT_ID }, 'test')
const db = getFirestore(adminApp)
const BASE = 'http://localhost:5287'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

let pass = 0, fail = 0
const check = (label, ok, extra = '') => { ok ? pass++ : fail++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${extra ? ` (${extra})` : ''}`) }

let ipCounter = 10
const newIp = () => `198.51.100.${ipCounter++}`

async function req(path, { method = 'GET', cookie, body, html, ip = '192.0.2.1', token } = {}) {
  const headers = { 'x-real-ip': ip }
  if (cookie) headers.cookie = cookie
  if (html) headers.accept = 'text/html'
  if (token) headers.authorization = `Bearer ${token}`
  if (body) headers['content-type'] = 'application/json'
  const res = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined, redirect: 'manual' })
  const text = await res.text()
  let json = null
  try { json = JSON.parse(text) } catch {}
  return { status: res.status, headers: res.headers, text, json }
}
const cookieFrom = (res, name) => {
  const raw = res.headers.getSetCookie?.().find((c) => c.startsWith(`${name}=`)) || ''
  return { raw, pair: raw.split(';')[0] }
}
async function adminToken(email = admin.email, password = admin.password) {
  const res = await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=test', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password, returnSecureToken: true }),
  })
  return (await res.json()).idToken
}
async function visitorLogin(code, ip = newIp()) {
  const res = await req('/api/access', { method: 'POST', body: { code }, ip })
  return { res, cookie: cookieFrom(res, 'pf_access').pair }
}

const PAGES = ['/', '/welcome', '/biography', '/career', '/achievements', '/awards', '/education', '/gallery', '/gallery/adventure', '/index.html', '/career?tab=1']
const PHOTO = '/src/assets/images/hero/a1.png'

console.log('\n── 1. Without an access code')
for (const p of PAGES) {
  const r = await req(p, { html: true })
  check(`page ${p} redirects to the access page`, r.status === 302 && (r.headers.get('location') || '').startsWith('/access'), `${r.status} ${r.headers.get('location')}`)
}
check('photograph is refused', (await req(PHOTO)).status === 401)
for (const p of ['/access', '/crest.png', '/access.js', '/access.css', '/admin/login']) check(`open: ${p}`, (await req(p, { html: true })).status === 200)
for (const p of ['/api/portfolio', '/api/gallery', '/api/gallery?collection=adventure', '/api/admin-access']) {
  const r = await req(p)
  check(`API ${p} returns 401 without data`, r.status === 401 && !/biography|workHistory|thumbnailUrl/.test(r.text), String(r.status))
}
check('upload API refuses', (await req('/api/upload', { method: 'POST', body: { file: 'x' } })).status === 401)
check('protected responses are not cacheable', /no-store/.test((await req('/api/portfolio')).headers.get('cache-control') || ''))

const client = clientDb(initClient({ apiKey: 'test', projectId: env.VITE_FIREBASE_PROJECT_ID }, 'client'))
connectFirestoreEmulator(client, '127.0.0.1', 8089)
const denied = async (path) => { try { await cget(cdoc(client, path)); return false } catch (e) { return e.code === 'permission-denied' } }
check('browser cannot read portfolio content from Firestore', await denied('portfolio/portfolio_main'))
check('browser cannot read the admin account', await denied('portfolio/admin_account'))
check('browser cannot read access config', await denied('access_control/config'))
check('browser cannot read visitor sessions', await denied('visitor_sessions/x'))
check('browser cannot read access logs', await denied('access_logs/x'))
check('browser can read content-free change marker', !(await denied('site_meta/access')))

console.log('\n── 2. Before a code exists')
check('any code is refused as unavailable', (await visitorLogin('GAF-AAAA-BBBB-CCCC')).res.json?.error === 'unavailable')

console.log('\n── 3. Administrator creates a code')
const token = await adminToken()
check('visitor-less admin API works with admin token', (await req('/api/admin-access', { token })).json?.hasCode === false)
let gen = await req('/api/admin-access', { method: 'POST', token, body: { action: 'generate' } })
let code1 = gen.json?.code
check('generated code has the strong format', /^GAF-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/.test(code1 || ''), code1)
const cfg = (await db.doc('access_control/config').get()).data()
check('only a scrypt hash is stored', cfg.codeHash.startsWith('scrypt$') && !cfg.codeHash.includes(code1.replace(/-/g, '')), cfg.codeHash.slice(0, 20) + '…')
check('weak custom code rejected', (await req('/api/admin-access', { method: 'POST', token, body: { action: 'set', code: 'Badasu1972' } })).status === 400)
check('short custom code rejected', (await req('/api/admin-access', { method: 'POST', token, body: { action: 'set', code: '12345' } })).status === 400)

console.log('\n── 4. Visitor enters codes')
check('wrong code refused', (await visitorLogin('GAF-WRNG-CODE-1234')).res.status === 401)
const typed = code1.toLowerCase().replace(/-/g, ' ')
let { res: okRes, cookie: visitor } = await visitorLogin(typed)
check('correct code accepted (any case/spacing)', okRes.status === 200, String(okRes.status))
const raw = cookieFrom(okRes, 'pf_access').raw
check('cookie is HttpOnly, SameSite=Lax, Path=/', /HttpOnly/.test(raw) && /SameSite=Lax/.test(raw) && /Path=\//.test(raw))
check('cookie lasts exactly one hour', /Max-Age=3600\b/.test(raw))
check('session ends one hour after access', Math.abs(okRes.json.expiresAt - Date.now() - 3600_000) < 5000)

console.log('\n── 5. With a valid session')
for (const p of PAGES) check(`page ${p} opens`, (await req(p, { html: true, cookie: visitor })).status === 200)
check('photograph loads', (await req(PHOTO, { cookie: visitor })).status === 200)
const portfolio = await req('/api/portfolio', { cookie: visitor })
check('portfolio API returns content', portfolio.status === 200 && !!portfolio.json?.data?.officer?.name)
check('portfolio API is private, no-store', /private/.test(portfolio.headers.get('cache-control')) && /no-store/.test(portfolio.headers.get('cache-control')))
check('gallery API returns collections', (await req('/api/gallery', { cookie: visitor })).json?.collections?.length > 0)
const before = (await db.collection('visitor_sessions').orderBy('createdAt', 'desc').limit(1).get()).docs[0].data().expiresAt
for (let i = 0; i < 3; i++) await req('/api/portfolio', { cookie: visitor })
const after = (await db.collection('visitor_sessions').orderBy('createdAt', 'desc').limit(1).get()).docs[0].data().expiresAt
check('activity does not extend the session', before === after && !cookieFrom(await req('/api/portfolio', { cookie: visitor }), 'pf_access').raw)

console.log('\n── 6. Visitor code gives no admin access')
check('admin API refuses visitor cookie', (await req('/api/admin-access', { cookie: visitor })).status === 401)
check('upload API refuses visitor cookie', (await req('/api/upload', { method: 'POST', cookie: visitor, body: { file: 'x' } })).status === 401)
check('admin cookie cannot be obtained with visitor cookie', (await req('/api/admin-session', { method: 'POST', cookie: visitor })).status === 401)
check('visitor code is not an admin password', !(await adminToken(admin.email, code1)))

console.log('\n── 7. Forged, altered and expired cookies')
const parts = visitor.split('=')[1].split('.')
const altered = `pf_access=${[parts[0], parts[1], String(Number(parts[2]) + 3600_000), ...parts.slice(3)].join('.')}`
check('altered expiry rejected by API', (await req('/api/portfolio', { cookie: altered })).status === 401)
check('altered expiry rejected for pages', (await req('/career', { html: true, cookie: altered })).status === 302)
const { signVisitorToken } = await import('./api/_token.js')
process.env.ACCESS_SESSION_SECRET = env.ACCESS_SESSION_SECRET
const cfgNow = (await db.doc('access_control/config').get()).data()
const expiredTok = await signVisitorToken({ sessionId: parts[1], expiresAt: Date.now() - 1000, codeVersion: cfgNow.codeVersion, epoch: cfgNow.epoch })
check('expired cookie rejected by API', (await req('/api/portfolio', { cookie: `pf_access=${expiredTok}` })).status === 401)
check('expired cookie rejected for pages', (await req('/career', { html: true, cookie: `pf_access=${expiredTok}` })).status === 302)
const fakeTok = await signVisitorToken({ sessionId: 'not-a-real-session', expiresAt: Date.now() + 3600_000, codeVersion: cfgNow.codeVersion, epoch: cfgNow.epoch })
check('signed cookie without a stored session rejected by API', (await req('/api/portfolio', { cookie: `pf_access=${fakeTok}` })).status === 401)
// Server-side expiry: the stored session reaches its end time
const latest = (await db.collection('visitor_sessions').orderBy('createdAt', 'desc').limit(1).get()).docs[0]
await latest.ref.update({ expiresAt: Date.now() - 1 })
check('session past its end time is refused', (await req('/api/portfolio', { cookie: visitor })).status === 401)

console.log('\n── 8. Rate limiting')
const attackerIp = newIp()
const statuses = []
for (let i = 0; i < 6; i++) statuses.push((await req('/api/access', { method: 'POST', body: { code: `GAF-BAD${i}-XXXX-YYYY` }, ip: attackerIp })).status)
check('5 wrong codes then throttled', statuses.slice(0, 5).every((s) => s === 401) && statuses[5] === 429, statuses.join(','))
check('throttled address refused even with the right code', (await req('/api/access', { method: 'POST', body: { code: code1 }, ip: attackerIp })).status === 429)
check('other addresses unaffected', (await visitorLogin(code1)).res.status === 200)

console.log('\n── 9. Changing the code')
;({ cookie: visitor } = await visitorLogin(code1))
check('session valid before change', (await req('/api/portfolio', { cookie: visitor })).status === 200)
gen = await req('/api/admin-access', { method: 'POST', token, body: { action: 'generate' } })
const code2 = gen.json.code
check('old session ends immediately (API)', (await req('/api/portfolio', { cookie: visitor })).status === 401)
await sleep(5500)
check('old session ends for pages', (await req('/career', { html: true, cookie: visitor })).status === 302)
check('old code stops working', (await visitorLogin(code1)).res.status === 401)
;({ res: okRes, cookie: visitor } = await visitorLogin(code2))
check('new code works', okRes.status === 200)
const setRes = await req('/api/admin-access', { method: 'POST', token, body: { action: 'set', code: 'Mango-7Tq-Rv92-Lx' } })
check('administrator-chosen code accepted', setRes.status === 200)
check('previous generated code stops working', (await visitorLogin(code2)).res.status === 401)
;({ res: okRes, cookie: visitor } = await visitorLogin('mango7tqrv92lx'))
check('chosen code works (case/dash-insensitive)', okRes.status === 200)
const code3 = 'Mango-7Tq-Rv92-Lx'

console.log('\n── 10. Revoke all sessions')
const second = (await visitorLogin(code3)).cookie
const rev = await req('/api/admin-access', { method: 'POST', token, body: { action: 'revoke' } })
check('revoke reports ended sessions', rev.json?.revoked >= 2, String(rev.json?.revoked))
check('all sessions refused', (await req('/api/portfolio', { cookie: visitor })).status === 401 && (await req('/api/portfolio', { cookie: second })).status === 401)
check('code still works after revoke', (await visitorLogin(code3)).res.status === 200)

console.log('\n── 11. Disable and enable access')
;({ cookie: visitor } = await visitorLogin(code3))
await req('/api/admin-access', { method: 'POST', token, body: { action: 'disable' } })
check('existing session refused when disabled', (await req('/api/portfolio', { cookie: visitor })).status === 401)
check('correct code refused as unavailable', (await visitorLogin(code3)).res.json?.error === 'unavailable')
check('status reports unavailable', (await req('/api/access')).json?.available === false)
await sleep(5500)
check('pages locked when disabled', (await req('/career', { html: true, cookie: visitor })).status === 302)
await req('/api/admin-access', { method: 'POST', token, body: { action: 'enable' } })
check('code works again after enabling', (await visitorLogin(code3)).res.status === 200)

console.log('\n── 12. Administrator preview and admin separation')
const adminCookieRes = await req('/api/admin-session', { method: 'POST', token })
const adminCookie = cookieFrom(adminCookieRes, 'pf_admin').pair
check('administrator gets preview cookie', adminCookieRes.status === 200 && !!adminCookie)
check('administrator can open portfolio pages', (await req('/career', { html: true, cookie: adminCookie })).status === 200)
check('administrator can load content', (await req('/api/portfolio', { cookie: adminCookie })).status === 200)
check('admin cookie does not open admin API (token required)', (await req('/api/admin-access', { cookie: adminCookie })).status === 401)
await getAuth(adminApp).createUser({ email: 'someone@example.com', password: 'Someone-Pass-123' }).catch(() => {})
const otherToken = await adminToken('someone@example.com', 'Someone-Pass-123')
check('other Firebase accounts refused by admin API', (await req('/api/admin-access', { token: otherToken })).status === 403)

console.log('\n── 13. Activity log')
const overview = (await req('/api/admin-access', { token })).json
const types = new Set(overview.logs.map((l) => l.type))
for (const t of ['success', 'failure', 'rate_limited', 'code_changed', 'sessions_revoked', 'access_disabled', 'access_enabled', 'denied_unavailable']) check(`log records ${t}`, types.has(t))
const logText = JSON.stringify(overview.logs).toUpperCase().replace(/[\s-]/g, '')
check('no access code appears in the logs', ![code1, code2, code3].some((c) => logText.includes(c.toUpperCase().replace(/[\s-]/g, ''))))
check('logged addresses are shortened', overview.logs.filter((l) => l.ip).every((l) => /\.0$|::$|unknown/.test(l.ip)))
const allDocs = []
for (const col of ['access_control', 'visitor_sessions', 'access_logs', 'access_rate_limits', 'site_meta']) (await db.collection(col).get()).docs.forEach((d) => allDocs.push(JSON.stringify(d.data())))
const stored = allDocs.join('').toUpperCase().replace(/[\s-]/g, '')
check('no plain access code stored anywhere', ![code1, code2, code3].some((c) => stored.includes(c.toUpperCase().replace(/[\s-]/g, ''))))
check('sessions listed with status', overview.sessions.some((s) => s.status === 'active') && overview.sessions.some((s) => s.status === 'revoked'))

console.log(`\n${pass} passed, ${fail} failed`)
console.log(`CURRENT_CODE=${code3}`)
process.exit(0)
