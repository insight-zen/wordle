const body = document.querySelector("body")

// Identifier for the popup div that is shown
const divDataCode = "popDiv"
const divDataAttr = `[data-pop-div]`

export const popDiv = {

  // Return an SVG element
  svgElement({svg, path}){
    var eSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    Object.entries(svg).forEach(([key, value]) => eSvg.setAttribute(key, value))

    var ePath = document.createElementNS("http://www.w3.org/2000/svg", "path")
    Object.entries(path).forEach(([key, value]) => ePath.setAttribute(key, value))
    eSvg.appendChild(ePath)
    return(eSvg)
  },

  svgCloseIcon(){
    return this.svgElement({
      svg: {height: "24", viewBox: "0 0 24 24", width: "24"},
      path: {fill: "var(--fg)", d: "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"}
    })
  },

  closeIconStr(wrap=null){
    const pl = `<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
    <path fill="var(--fg)" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path>
    </svg>
    `
    if (!wrap) return(pl)
    return(`<div class="close" data-close>${pl}</div>`)
  },

  // Close Icon for the popup
  get closeDiv(){
    const dClose = document.createElement("div")
    dClose.classList.add("close")
    const iClose = this.svgCloseIcon()
    iClose.addEventListener("click", popDiv.remove)
    dClose.prepend(iClose)
    return dClose
  },

  show(msg="Insert your message here"){
    let pd = document.querySelector(divDataAttr)
    let contentDiv = pd ? pd.querySelector("div.content") : null

    if (!pd) {
      pd = document.createElement("div")
      pd.classList.add("pop-div")
      pd.dataset[divDataCode] = ""
      pd.prepend(this.closeDiv)
      contentDiv = document.createElement("div")
      contentDiv.classList.add("content")
      pd.append(contentDiv)
      body.prepend(pd)
    }
    contentDiv.innerHTML = msg
    return pd
  },

  append(msg) {
    const contentDiv = document.querySelector(`${divDataAttr} div.content`)
    contentDiv.innerHTML = `${contentDiv.innerHTML} ${msg}`
  },

  remove(){
    const pd = [...document.querySelectorAll(divDataAttr)]
    pd.forEach(e => e.remove())
  },

  toggle(msg="Insert your popup message here"){
    let pd = document.querySelector(divDataAttr)
    if (!pd) {
      pd = popDiv.show(msg)
    } else {
      popDiv.remove()
      // pd.classList.toggle('hidden')
    }
  },

  button(label){
    const btn = document.createElement("button")
    btn.classList.add("pop")
    btn.dataset.pop = ""
    btn.textContent = label
    body.prepend(btn)
    btn.addEventListener("click", popDiv.toggle)
    this.show("<p>Check back as you play for helpful hints</p>")
    this.toggle()
  },

  info(){
    console.log("I am in popDiv")
  }
}


