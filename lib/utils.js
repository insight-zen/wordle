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
export const showAlert = ({message, duration=1000, noTrans, klass}={}) => {
  const alertContainer = document.getElementById("alert-container")
  const alert = document.createElement("div")
  alert.textContent = message
  alert.className = ["alert", klass].filter(e => e).join(" ")
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
