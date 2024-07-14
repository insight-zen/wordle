// Randomly chosen word from the given array
export const randIndex = length => Math.floor(Math.random()*length)

// Randomly chosen word from the given array
export const randWord = wordArr => wordArr[randIndex(wordArr.length)]

// Shuffle
export const shuffleIndex = (size) => {
  let rv = new Set()
  while (rv.size < size) {
    rv.add(randIndex(size))
  }
  return Array.from(rv)
}

// Shuffle
export const shuffle = (input) => {
  const shOrder = shuffleIndex(input.length)
  return shOrder.map(ix => input[ix])
}

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


export const shakeTiles = (tiles) => {
  tiles.forEach( tile => {
    tile.classList.add("shake")
    tile.addEventListener("animationend", () => {
      tile.classList.remove("shake")
    }, {once: true})
  })
}

export const danceTiles = (tiles) => {
  tiles.forEach( (tile, index) => {
    setTimeout(() => {
      tile.classList.add("dance")
      tile.addEventListener("animationend", () => {
        tile.classList.remove("dance")
      }, {once: true})
    }, (index * DANCE_ANIMATION_DURATION / 5) )
  })
}

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




// const permuteX = (str) => {
//   let combinations = []
//   for (let i = 0; i < str.length; i++) {
//     for (let j = i + 1; j < str.length + 1; j++) {
//       combinations.push(str.slice(i, j));
//     }				// 
//   }
//   return combinations;
// }
