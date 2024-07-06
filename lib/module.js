import { Wordle } from "../lib/wordle.js"
// import popDiv from "../lib/pop_div.js"

Wordle.start()
// window.wordle = Wordle
// popDiv.button("Popup")


const regSw = () => {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").then(registration => {
      console.log(` * SW Registered, scope`, registration.scope)
    }).catch(error => {
      console.log(` ** SW Registered Failed`, error)
    })
  }
}

window.addEventListener("load", regSw)      

