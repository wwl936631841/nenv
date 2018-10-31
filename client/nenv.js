import initNenv, * as nenv from './'

// window.nenv = nenv

initNenv()
    .catch((err) => {
      console.error(`${err.message}\n${err.stack}`)
    })
