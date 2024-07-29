import { Wordle } from "../lib/wordle.js"

const regSw = () => {
  if ("serviceWorker" in navigator) {
    const url = new URL(document.URL)
    const swName = `${url.origin.endsWith("/wordle/") ? "/wordle" : ""}/sw.js`
    // console.log(`Registering: ${swName}`)
    navigator.serviceWorker.register(swName).then(registration => {
      console.log(` * SW Registered, scope`, registration.scope)
    }).catch(error => {
      console.log(` ** SW Registered Failed`, error)
    })
  }
}

// const url = new URL(document.URL)
// console.log("URL Origin", url.origin)
// window.addEventListener("load", regSw)
// For testing using a chosen word, use: Wordle.start(null, "great")
// Wordle.start(null, "great")
Wordle.start()

