// Access page. The code is checked by the server (POST /api/access); nothing here decides access.
;(function () {
  var form = document.getElementById('form')
  var input = document.getElementById('code')
  var submit = document.getElementById('submit')
  var msg = document.getElementById('msg')
  var show = document.getElementById('show')
  var params = new URLSearchParams(location.search)

  // Only same-site portfolio paths are accepted as the destination
  var next = params.get('next') || '/'
  if (!/^\/(?!\/)/.test(next) || /^\/(api|access|admin)(\/|\.|\?|$)/.test(next)) next = '/'

  var MESSAGES = {
    invalid: 'That access code is not valid. Check it and try again.',
    too_many_attempts: 'Too many attempts. Please wait a few minutes and try again.',
    unavailable: 'Portfolio access is temporarily unavailable.',
    expired: 'Your one-hour access has ended. Enter the access code again to continue.',
    revoked: 'Your access has ended. Enter the current access code to continue.',
    error: 'Something went wrong. Check your connection and try again.',
  }

  function say(key, info) {
    msg.textContent = MESSAGES[key] || ''
    msg.className = 'msg' + (info ? ' info' : '')
  }

  function setBusy(busy) {
    submit.disabled = busy
    submit.classList.toggle('busy', busy)
  }

  function unavailable() {
    say('unavailable')
    input.disabled = true
    submit.disabled = true
  }

  if (params.get('reason') === 'expired') say('expired', true)
  if (params.get('reason') === 'revoked') say('revoked', true)

  show.addEventListener('click', function () {
    var visible = input.type === 'text'
    input.type = visible ? 'password' : 'text'
    show.textContent = visible ? 'Show' : 'Hide'
    show.setAttribute('aria-pressed', String(!visible))
    input.focus()
  })

  fetch('/api/access', { credentials: 'same-origin', cache: 'no-store' })
    .then(function (res) { return res.ok ? res.json() : { available: false } })
    .then(function (status) {
      if (status.authenticated) location.replace(next)
      else if (status.available === false) unavailable()
    })
    .catch(function () {})

  form.addEventListener('submit', function (event) {
    event.preventDefault()
    var code = input.value.trim()
    if (!code) {
      say('invalid')
      input.focus()
      return
    }
    setBusy(true)
    say('')
    fetch('/api/access', {
      method: 'POST',
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code }),
    })
      .then(function (res) {
        if (res.ok) {
          input.value = ''
          location.replace(next)
          return
        }
        return res.json().catch(function () { return {} }).then(function (body) {
          setBusy(false)
          if (body.error === 'unavailable') return unavailable()
          say(MESSAGES[body.error] ? body.error : 'error')
          input.select()
        })
      })
      .catch(function () {
        setBusy(false)
        say('error')
      })
  })

  input.focus()
})()
