const DANCE_ANIMATION_DURATION = 500

// Randomly choose an integer from 0 up to and not including length
export const randIndex = length => Math.floor(Math.random()*length)

// Randomly chose a word from the given array
export const randWord = wordArr => wordArr[randIndex(wordArr.length)]

// Take an array of ints from 0 to size. Return shuffled indexes
export const shuffleIndex = (size) => {
  let rv = new Set()
  while (rv.size < size) {
    rv.add(randIndex(size))
  }
  return Array.from(rv)
}

// Return the shuffled input array
export const shuffle = (input) => {
  const shOrder = shuffleIndex(input.length)
  return shOrder.map(ix => input[ix])
}

// return sorted string
export const alphaSort = (input) => input.split("").sort().join("")

// Pick 1 to length characters and return choices
export const permute = (str) => {
    let strLength = str.length
    let result = []
    let currentIndex = 0
    while (currentIndex < strLength) {
        let char = str.charAt(currentIndex)
        let x
        let arrTemp = [char]
        for (x in result) {
            arrTemp.push("" + result[x] + char)
        }
        result = result.concat(arrTemp)
        currentIndex++
    }
    return result
}

// Partition array by length of the string. Keys are lenghts, values are words
export const lengthBuckets = (inpArr) => {
  return inpArr.reduce((acc, item) => {
    acc[item.length] = (acc[item.length] || 0) + 1
    return acc
  }, {})
}

// -- For Sets --

// Converts set to a string. handles null input and where input is a string
export const joinSet = (set, joinStr=", ", sort=true) => {
  if (!set) return "_"
  if (typeof(set) == "string") return "*"
  return sort ? [...set].sort().join(joinStr) : [...set].join(joinStr)
}

// -- For Maps --

// -- UI helpers --

export const shakeTiles = (tiles) => {
  tiles.forEach( tile => {
    tile.classList.add("shake")
    tile.addEventListener("animationend", () => {
      tile.classList.remove("shake")
    }, {once: true})
  })
}

export const danceTiles = (tiles, duration=DANCE_ANIMATION_DURATION) => {
  tiles.forEach( (tile, index) => {
    setTimeout(() => {
      tile.classList.add("dance")
      tile.addEventListener("animationend", () => {
        tile.classList.remove("dance")
      }, {once: true})
    }, (index * duration / 5) )
  })
}

// Create an alert and show it in the alertContainer
export const showAlert = ({message, duration=1000, noTrans, className, btnArr, ...opts}={}) => {
  const alertContainer = document.getElementById("alert-container")
  const nodes = [domE({textContent: message})]
  if (btnArr) {
    const btns = domBtns({btns: btnArr})
    nodes.push(btns)
  }
  const alert = domE({nodes, data: {r: "alert"}, className: ["alert", className]})
  alertContainer.prepend(alert)
  if (duration == null) return
  setTimeout(() => {
    alert.classList.add("hide")
    if (noTrans)
      alert.remove()
    else
      alert.addEventListener("transitionend", () => alert.remove())
  }, duration)
}

export const showBanner = ({message, heading, klass, ...opts}={}) => {
  const id = opts.id || randomID("banner")

  const nHeading = heading ? domE({nName: "h1", textContent: heading}) : null
  const nContent = message ? domE({textContent: message}) : null
  const btn = opts.noBtn ? null :
    domE({nName: "button", textContent: "Dismiss", className: "btn", click: () => {
      const ele = document.getElementById(id)
      console.log(`will remove: ${id}`, ele)
      ele.remove()
    }}) 
  const rv = domE({id, 
    nodes: [nHeading, nContent, btn],
    className: "banner"
  })
  if (opts.nodes)
    opts.nodes.forEach(n => rv.append(n))
    
  document.body.prepend(rv)
  return id
}

// dom based element creation and composing

export const randomID = (base="rnd", upto=1000) => `${base}_${Math.floor(Math.random() * upto)}`

export const domE = ({nName="div", ...opts}={}) => {
  const node = document.createElement(nName);
  if (opts.nodes) {
    if (Array.isArray(opts.nodes))
      opts.nodes.forEach(n => {
	if (n) node.append(n)
      })
      else
	node.append(opts.nodes)
  }
  if (opts.click)
    node.addEventListener("click", opts.click)

  if (opts.data) {
    for (let key in opts.data)
      node.dataset[key] = opts.data[key]
  }
    
  (["id", "textContent", "innerHTML", "className"]).forEach(a =>{
    if (!opts[a]) return
      node[a] = Array.isArray(opts[a]) ? opts[a].filter(e => e).join(" ") : opts[a]
  })
  return node
}

export const domBtn = ({...opts}={}) =>  domE({nName: "button", ...opts})

// Create a flex div with buttons
export const domBtns = ({btns, ...opts}={}) => {
  const nodes = btns.map(b => domBtn({...b, className: ["btn", opts.className]}))
  if (opts.zIndex)
    nodes.forEach(b => b.style.zIndex = opts.zIndex)
  const divBtns = domE({nodes, className: ["flex fl-jc-sa", opts.wrapClass]})
  return divBtns  
}

