import { Wordle } from "../lib/wordle.js"

const regSw = () => {
  if ("serviceWorker" in navigator) {
    const url = new URL(document.URL)
    const swName = `${url.href?.endsWith("/wordle/") ? "/wordle" : ""}/sw.js`
    // console.log(`Registering: ${swName}`)
    navigator.serviceWorker.register(swName).then(registration => {
      console.log(` * SW Registered, scope`, registration.scope)
    }).catch(error => {
      console.log(` ** SW Registered Failed`, error)
    })
  }
}

const pageUI = () => {
  const topMenu = document.getElementById("top-menu-btn")
  topMenu.addEventListener("click", (e) => {
    e.stopPropagation()
    const wrap = e.target.closest("[data-rel]")
    const menu = document.getElementById(wrap.dataset.rel)
    menu.classList.toggle("hidden")
  })
  console.log(`Handling Page load UI`)
}

document.addEventListener("DOMContentLoaded", pageUI)

// const url = new URL(document.URL)
// console.log("URL Origin", url.origin)
// Use the service worker only on the deployed site
window.addEventListener("load", regSw)
// For testing using a chosen word, use: Wordle.start(null, "great")
// Wordle.start(null, "tilde")
Wordle.start()

