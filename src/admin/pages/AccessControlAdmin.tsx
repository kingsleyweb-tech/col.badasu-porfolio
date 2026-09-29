import React, { useCallback, useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, Copy, Eye, EyeOff, KeyRound, Loader2, LockKeyhole, Power, RefreshCw, ShieldCheck, ShieldOff, UserX, X } from 'lucide-react'
import { adminFetch } from '../../services/adminApi'

type Session = {
  id: string
  createdAt: number
  expiresAt: number
  codeVersion: number
  ip: string | null
  userAgent: string | null
  status: 'active' | 'expired' | 'revoked' | 'ended'
  revokedReason: string | null
}

type LogEntry = {
  id: string
  type: string
  at: string
  ip?: string | null
  userAgent?: string | null
  codeVersion?: number
  session?: string
  detail?: string | null
  by?: string
  expiresAt?: number
}

type Overview = {
  enabled: boolean
  hasCode: boolean
  code: string | null
  codeVersion: number
  codeUpdatedAt: string | null
  sessionSeconds: number
  activeSessions: number
  sessions: Session[]
  logs: LogEntry[]
}

const EVENT_LABELS: Record<string, { label: string; tone: 'g' | 'gold' | 'gray' | 'red' }> = {
  success: { label: 'Access granted', tone: 'g' },
  failure: { label: 'Wrong code', tone: 'red' },
  rate_limited: { label: 'Throttled', tone: 'red' },
  denied_unavailable: { label: 'Refused (access off)', tone: 'gray' },
  signed_out: { label: 'Visitor signed out', tone: 'gray' },
  code_changed: { label: 'Code changed', tone: 'gold' },
  access_enabled: { label: 'Access enabled', tone: 'g' },
  access_disabled: { label: 'Access disabled', tone: 'gold' },
  sessions_revoked: { label: 'Sessions revoked', tone: 'gold' },
}

const formatTime = (value: string | number | null | undefined) =>
  value ? new Date(value).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'

/** "Mozilla/5.0 (iPhone; …) … Safari/…" → "Safari · iPhone" */
function describeDevice(ua?: string | null) {
  if (!ua) return 'Unknown device'
  const browser = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Browser'
  const os = /iPhone/.test(ua) ? 'iPhone' : /iPad/.test(ua) ? 'iPad' : /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows' : /Mac OS X/.test(ua) ? 'Mac' : /Linux/.test(ua) ? 'Linux' : 'Other'
  return `${browser} · ${os}`
}

class SetupRequiredError extends Error {}

async function readError(res: Response) {
  const body = (await res.json().catch(() => ({}))) as { error?: string; message?: string }
  if (body.error === 'setup_required') return new SetupRequiredError(body.message)
  return new Error(body.error || `Request failed (${res.status}).`)
}

export const AccessControlAdmin: React.FC = () => {
  const [overview, setOverview] = useState<Overview | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState<{ text: string; type: 'ok' | 'err' } | null>(null)
  const [newCode, setNewCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [copiedCurrent, setCopiedCurrent] = useState(false)
  const [customCode, setCustomCode] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  const [setupRequired, setSetupRequired] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await adminFetch('/api/admin-access')
      if (!res.ok) throw await readError(res)
      setOverview(await res.json())
      setSetupRequired(null)
    } catch (err) {
      if (err instanceof SetupRequiredError) setSetupRequired(err.message || 'Server setup needed.')
      else setMessage({ text: err instanceof Error ? err.message : 'Could not load access control.', type: 'err' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const act = async (action: string, extra: Record<string, string> = {}, confirmText?: string) => {
    if (confirmText && !window.confirm(confirmText)) return
    setBusy(action)
    setMessage(null)
    try {
      const res = await adminFetch('/api/admin-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extra }),
      })
      if (!res.ok) throw await readError(res)
      const body = await res.json()
      if (action === 'generate') {
        setNewCode(body.code)
        setCopied(false)
      }
      if (action === 'set') {
        setCustomCode('')
        setShowCustom(false)
      }
      const done: Record<string, string> = {
        generate: 'New access code created. All visitors must use it from now on.',
        set: 'Access code changed. All visitors must use the new code from now on.',
        enable: 'Portfolio access is enabled.',
        disable: 'Portfolio access is disabled. Every visitor session has ended.',
        revoke: `All visitor sessions have ended (${body.revoked ?? 0}). Visitors must enter the code again.`,
      }
      setMessage({ text: done[action], type: 'ok' })
      await load()
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'That did not work. Try again.', type: 'err' })
    } finally {
      setBusy(null)
    }
  }

  const copyCode = async () => {
    if (!newCode) return
    try {
      await navigator.clipboard.writeText(newCode)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  const copyCurrent = async () => {
    if (!overview?.code) return
    try {
      await navigator.clipboard.writeText(overview.code)
      setCopiedCurrent(true)
      window.setTimeout(() => setCopiedCurrent(false), 2000)
    } catch {
      setCopiedCurrent(false)
    }
  }

  const status = !overview ? null : !overview.hasCode ? 'nocode' : overview.enabled ? 'active' : 'disabled'
  const hours = overview ? overview.sessionSeconds / 3600 : 1

  return (
    <div className="ad-page">
      <div className="ad-ph">
        <div className="t">
          <span className="ic"><LockKeyhole size={26} /></span>
          <div>
            <h1>Access control</h1>
            <p>Visitors need the access code to open the portfolio. Each code entry gives exactly {hours} hour{hours === 1 ? '' : 's'} of access.</p>
          </div>
        </div>
        <button type="button" className="ad-b l" onClick={() => { setLoading(true); load() }} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'admin-spinner' : undefined} /> Refresh
        </button>
      </div>

      {message && (
        <div className={`ad-alert ${message.type}`} role="status">
          {message.type === 'ok' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{message.text}</span>
          <button type="button" className="x" onClick={() => setMessage(null)} aria-label="Dismiss message"><X size={16} /></button>
        </div>
      )}

      {newCode && (
        <div className="ad-acc-new" role="region" aria-label="New access code">
          <div>
            <span className="ad-tag"><i />New access code</span>
            <code>{newCode}</code>
            <p>Share it privately. You can see and copy it again any time under Portfolio access.</p>
          </div>
          <div className="acts">
            <button type="button" className="ad-b gold" onClick={copyCode}>
              {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />} {copied ? 'Copied' : 'Copy code'}
            </button>
            <button type="button" className="ad-b lw" onClick={() => setNewCode(null)}>Done</button>
          </div>
        </div>
      )}

      {setupRequired && (
        <div className="ad-card">
          <div className="hd">
            <div>
              <h3>One-time server setup needed</h3>
              <p>Access control runs on the server, which needs a Firebase service-account key. Until it has one, visitors see “Portfolio access is temporarily unavailable”.</p>
            </div>
            <span className="ad-pill gold">Setup</span>
          </div>
          <div className="ad-alert err" style={{ marginBottom: 16 }}><AlertCircle size={18} /><span>{setupRequired}</span></div>
          <ol className="ad-acc-steps">
            <li>Open the Firebase console, then <b>Project settings → Service accounts</b>.</li>
            <li>Click <b>Generate new private key</b> and download the file.</li>
            <li>Local: save it in the project folder as <code>service-account.json</code> and add <code>FIREBASE_SERVICE_ACCOUNT_FILE=service-account.json</code> to <code>.env</code>. Then restart <code>npm run dev</code>.</li>
            <li>Vercel: add an environment variable <code>FIREBASE_SERVICE_ACCOUNT</code> with the whole file contents, plus <code>ACCESS_SESSION_SECRET</code>, then redeploy.</li>
          </ol>
          <p className="ad-hint">The key file is a secret: it is ignored by Git and must never be shared or committed.</p>
        </div>
      )}

      {setupRequired ? null : loading && !overview ? (
        <div className="ad-card"><p className="ad-empty"><Loader2 size={18} className="admin-spinner" /> Loading access control…</p></div>
      ) : overview && (
        <>
          <div className="ad-two">
            <div className="ad-card">
              <div className="hd">
                <div>
                  <h3>Portfolio access</h3>
                  <p>Changes take effect immediately for every visitor.</p>
                </div>
                <span className={`ad-pill ${status === 'active' ? 'g' : status === 'disabled' ? 'gold' : 'gray'}`}>
                  {status === 'active' ? 'Active' : status === 'disabled' ? 'Disabled' : 'No code set'}
                </span>
              </div>

              <div className="ad-kv ad-acc-code">
                <span>Access code</span>
                {!overview.hasCode ? (
                  <b>Not set</b>
                ) : overview.code ? (
                  <span className="val">
                    <b className={revealed ? 'plain' : 'ad-acc-mask'}>{revealed ? overview.code : '••••••••••••'}</b>
                    <button type="button" className="ad-b sm l" onClick={() => setRevealed((v) => !v)} aria-pressed={revealed}>
                      {revealed ? <EyeOff size={14} /> : <Eye size={14} />} {revealed ? 'Hide' : 'Show'}
                    </button>
                    <button type="button" className="ad-b sm gold" onClick={copyCurrent}>
                      {copiedCurrent ? <CheckCircle2 size={14} /> : <Copy size={14} />} {copiedCurrent ? 'Copied' : 'Copy'}
                    </button>
                  </span>
                ) : (
                  <b className="ad-acc-note">Set before codes were viewable. Generate a new code to see and copy it here.</b>
                )}
              </div>
              <div className="ad-kv"><span>Code version</span><b>{overview.codeVersion || '—'}</b></div>
              <div className="ad-kv"><span>Code last changed</span><b>{formatTime(overview.codeUpdatedAt)}</b></div>
              <div className="ad-kv"><span>Session duration</span><b>{hours} hour{hours === 1 ? '' : 's'} (not extended by activity)</b></div>
              <div className="ad-kv"><span>Visitors signed in now</span><b className="green">{overview.activeSessions}</b></div>

              {status === 'nocode' && (
                <div className="ad-alert info" style={{ marginTop: 16 }}>
                  <AlertCircle size={18} />
                  <span>No access code yet, so nobody can open the portfolio. Generate one to start sharing.</span>
                </div>
              )}

              <div className="ad-acc-acts">
                <button
                  type="button"
                  className="ad-b g"
                  disabled={!!busy}
                  onClick={() => act('generate', {}, overview.hasCode ? 'Generate a new code? The current code stops working and every visitor is signed out.' : undefined)}
                >
                  {busy === 'generate' ? <Loader2 size={16} className="admin-spinner" /> : <KeyRound size={16} />} Generate new code
                </button>
                <button type="button" className="ad-b l" disabled={!!busy} onClick={() => setShowCustom((v) => !v)} aria-expanded={showCustom}>
                  <KeyRound size={16} /> Change access code
                </button>
                {overview.hasCode && (overview.enabled ? (
                  <button
                    type="button"
                    className="ad-b red"
                    disabled={!!busy}
                    onClick={() => act('disable', {}, 'Disable portfolio access? Every visitor is signed out and nobody can enter until you enable it again.')}
                  >
                    {busy === 'disable' ? <Loader2 size={16} className="admin-spinner" /> : <ShieldOff size={16} />} Disable access
                  </button>
                ) : (
                  <button type="button" className="ad-b g" disabled={!!busy} onClick={() => act('enable')}>
                    {busy === 'enable' ? <Loader2 size={16} className="admin-spinner" /> : <Power size={16} />} Enable access
                  </button>
                ))}
                <button
                  type="button"
                  className="ad-b red"
                  disabled={!!busy || overview.activeSessions === 0}
                  onClick={() => act('revoke', {}, 'Sign out every visitor now? They will need to enter the access code again.')}
                >
                  {busy === 'revoke' ? <Loader2 size={16} className="admin-spinner" /> : <UserX size={16} />} Revoke all sessions
                </button>
              </div>

              {showCustom && (
                <form
                  className="ad-acc-custom"
                  onSubmit={(e) => {
                    e.preventDefault()
                    act('set', { code: customCode }, 'Change the access code? The current code stops working and every visitor is signed out.')
                  }}
                >
                  <label className="ad-lbl" htmlFor="acc-code">New access code</label>
                  <div className="row">
                    <input
                      id="acc-code"
                      className="ad-field"
                      type="text"
                      autoComplete="off"
                      spellCheck={false}
                      value={customCode}
                      onChange={(e) => setCustomCode(e.target.value)}
                      placeholder="At least 10 letters and numbers"
                      required
                    />
                    <button type="submit" className="ad-b g" disabled={!!busy || !customCode.trim()}>
                      {busy === 'set' ? <Loader2 size={16} className="admin-spinner" /> : <CheckCircle2 size={16} />} Save code
                    </button>
                  </div>
                  <p className="ad-hint">Mix letters and numbers; avoid names, ranks, dates and common words. Letter case, spaces and dashes are ignored. A generated code is stronger.</p>
                </form>
              )}
            </div>

            <div className="ad-side">
              <div className="ad-card">
                <div className="hd"><h3>How visitors get in</h3></div>
                <ol className="ad-acc-steps">
                  <li>They scan the QR code or open the portfolio link.</li>
                  <li>The access page asks for the code; the server checks it.</li>
                  <li>They can browse for {hours} hour{hours === 1 ? '' : 's'}, then the code is needed again.</li>
                </ol>
                <p className="ad-hint"><ShieldCheck size={13} style={{ verticalAlign: '-2px' }} /> The visitor code never opens this dashboard. Share the code privately, never inside the QR code.</p>
              </div>
            </div>
          </div>

          <div className="ad-card">
            <div className="hd">
              <div>
                <h3>Visitor sessions</h3>
                <p>Sessions from the last 24 hours.</p>
              </div>
            </div>
            {overview.sessions.length === 0 ? (
              <p className="ad-empty">No visitor sessions in the last 24 hours.</p>
            ) : (
              <div className="ad-acc-table" role="table" aria-label="Visitor sessions">
                <div className="tr th" role="row">
                  <span role="columnheader">Status</span><span role="columnheader">Started</span><span role="columnheader">Ends</span><span role="columnheader">Device</span><span role="columnheader">Network</span><span role="columnheader">Code</span>
                </div>
                {overview.sessions.map((s) => (
                  <div className="tr" role="row" key={s.id}>
                    <span role="cell"><span className={`ad-pill ${s.status === 'active' ? 'g' : s.status === 'revoked' ? 'gold' : 'gray'}`}>{s.status}</span></span>
                    <span role="cell" data-label="Started">{formatTime(s.createdAt)}</span>
                    <span role="cell" data-label="Ends">{formatTime(s.expiresAt)}{s.revokedReason ? ` · ${s.revokedReason}` : ''}</span>
                    <span role="cell" data-label="Device">{describeDevice(s.userAgent)}</span>
                    <span role="cell" data-label="Network">{s.ip || '—'}</span>
                    <span role="cell" data-label="Code">v{s.codeVersion}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="ad-card">
            <div className="hd">
              <div>
                <h3>Access activity</h3>
                <p>The latest 100 events. Codes are never recorded; network addresses are shortened.</p>
              </div>
            </div>
            {overview.logs.length === 0 ? (
              <p className="ad-empty">No activity yet.</p>
            ) : (
              <div className="ad-acc-table log" role="table" aria-label="Access activity">
                <div className="tr th" role="row">
                  <span role="columnheader">Event</span><span role="columnheader">When</span><span role="columnheader">Details</span><span role="columnheader">Device</span><span role="columnheader">Network</span><span role="columnheader">Code</span>
                </div>
                {overview.logs.map((log) => {
                  const kind = EVENT_LABELS[log.type] ?? { label: log.type, tone: 'gray' as const }
                  const details = [log.detail, log.by ? `by ${log.by}` : null, log.expiresAt ? `until ${formatTime(log.expiresAt)}` : null].filter(Boolean).join(' · ')
                  return (
                    <div className="tr" role="row" key={log.id}>
                      <span role="cell"><span className={`ad-pill ${kind.tone === 'red' ? 'red' : kind.tone}`}>{kind.label}</span></span>
                      <span role="cell" data-label="When">{formatTime(log.at)}</span>
                      <span role="cell" data-label="Details">{details || '—'}</span>
                      <span role="cell" data-label="Device">{log.by ? '—' : describeDevice(log.userAgent)}</span>
                      <span role="cell" data-label="Network">{log.ip || '—'}</span>
                      <span role="cell" data-label="Code">{log.codeVersion ? `v${log.codeVersion}` : '—'}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
