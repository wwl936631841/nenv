import fetch from 'unfetch'
import router from '../lib/router'
export default function h () {
  router.afterEach((from, to) => {
    // ping()
    return true
  })

  async function ping () {
    try {
      debugger
      const r = router.app.$router
      const url = `/_nenv/on-demand-entries-ping?page=${r.path}`
      const res = await fetch(url, {
        credentials: 'same-origin'
      })
      const payload = await res.json()
      if (payload.invalid) {
        const pageRes = await fetch(r.path, {
          credentials: 'same-origin'
        })
        if (pageRes.status === 200) {
          location.reload()
        }
      }
    } catch (err) {
      console.error(`Error with on-demand-entries-ping: ${err.message}`)
    }
  }

  let pingerTimeout
  async function runPinger (params) {
    while (!document.hidden) {
      await ping()
      await new Promise((resolve) => {
        pingerTimeout = setTimeout(resolve, 5000)
      })
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      runPinger()
    } else {
      clearTimeout(pingerTimeout)
    }
  })

  setTimeout(() => {
    runPinger()
      .catch((err) => {
        console.log(err)
      })
  })
}

setTimeout(() => {
  // h()
}, 1000)
