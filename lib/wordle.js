import { targetWords } from "./target5.js";
import { dictionary } from "./dict5.js";
import WordList from "../lib/word_list.js"
import WordFit from "../lib/word_fit.js"
import popDiv from "../lib/pop_div.js"

const refDict = new WordList(dictionary)
window.wlst = refDict

// -- Select a target word

function getTargetWord(y=2022, m=0, d=1) {
  const offsetFromDate = new Date(y, m, d)
  const msOffset = Date.now() - offsetFromDate
  const dayOffset = msOffset / (60 * 60 * 24 * 1000)
  return targetWords[Math.floor(dayOffset)]
}

function getRandomTargetWord(){
  const newWord = targetWords[Math.floor(Math.random()*targetWords.length)]
  return newWord
}

// -- Wordle Analytics and help

class WordleHelp {
  constructor(wordle){
    this.wordle = wordle;
  }

  // // Words from the dictionary that do no include already eliminated chars
  // eliminators(){
  //   return refDict.words.filter(dw =>
  //     this.wordle.eliminateddw.length === inputLength && inputChars.every(c => dw.includes(c)) )

  // }

  // Given an array of words, returns
  histogram(words) {

  }

  // Return words that are anagrams of input
  anagram(input){
    const inputLength = input.length
    const inputChars = input.split('')
    return refDict.words.filter(dw => dw.length === inputLength && inputChars.every(c => dw.includes(c)) )
  }

  pickedAndPlaced(){
    if ( (this.wordle.placed.length === 0) &&  (this.wordle.picked.length == 0) ) return {}
    const choices =  (this.wordle.placed.length == 0) ? this.forPlaced() : refDict.words
    if (this.wordle.picked.length == 0) return choices
    return choices.filter(dw => this.wordle.picked.every(p => dw.includes(p)) )
  }

  forPlaced(){
    if (this.wordle.placed.length == 0) return
    // placed is a hash of index: letter
    const placeRegex = [0,1,2,3,4].reduce((acc, ix) => {
      // If the character is placed use it, otherwise use a character placeholder
      const indexChar = wl.placed[ix] || "\\w"
      return acc + indexChar
    }, "")
    return refDict.words.filter(dw => dw.match(placeRegex))
  }

  forPicked(){
    if (this.wordle.picked.length == 0) return
    // If some letters are picked, find words that include the picked letters
    return refDict.words.filter(dw => this.wordle.picked.every(p => dw.includes(p)) )
  }
}

// -- Event listeners and click/key handlers.

function startInteraction(){
  document.addEventListener("click", handleMouseClick)
  document.addEventListener("keydown", handleKeyPress)
}

function stopInteraction(){
  document.removeEventListener("click", handleMouseClick)
  document.removeEventListener("keydown", handleKeyPress)
}

function handleMouseClick(e) {
  if (e.target.matches("[data-key]")) {
    Wordle.pressKey(e.target.dataset.key)
    return
  }

  if (e.target.matches("[data-enter]")) {
    Wordle.submitGuess()
    return
  }

  // Delete button includes an SVG.
  if (e.target.matches("[data-delete]") || e.target.closest("[data-delete]")) {
    Wordle.deleteKey()
    return
  }
}

function handleKeyPress(e) {
  if (e.key === "Enter") {
    Wordle.submitGuess()
    return
  }

  if (e.key === "Backspace" || e.key === "Delete") {
    Wordle.deleteKey()
    return
  }

  if (e.key.match(/^[a-z]$/)) {
    Wordle.pressKey(e.key)
    return
  }
}

// -- Wordle Class

const WORD_LENGTH = 5
const FLIP_ANIMATION_DURATION = 500
const DANCE_ANIMATION_DURATION = 500

const alertContainer = document.querySelector("[data-alert-container]")
const guessGrid = document.querySelector("[data-guess-grid]")
const keyBoard = document.querySelector("[data-keyboard]")
const replayButton = document.querySelector("[data-replay]")

const Wordle = {
  // moves: [],
  // placed: {},     // hash of index and placed letter
  // excluded: {},   // indexed hash of letters excluded from the position
  // picked: [],
  // eliminated: new Set(), // These letters do not appear in the word

  restartGame(){
    location.reload()
    // // this.targetWord = getRandomTargetWord()
    // // console.log(`In restart game, Target word: ${this.targetWord}`)
    // const tiles = guessGrid.querySelectorAll("div")
    // tiles.forEach(tile => Wordle.clearTile(tile))
    // const keys = keyBoard.querySelectorAll("button")
    // keys.forEach(key => key.classList.remove("wrong", "wrong-location", "correct"))
    // const alerts = alertContainer.querySelectorAll("div")
    // alerts.forEach(alert => alert.remove())
    // Wordle.start()
  },

  start(){
    this.moves = []    // Array of moves, stored in the order of attempts
    this.placed = {}   // hash of placed letters. by index (green tiles)
    this.excluded = {} // hash of Set of excluded letters. by index (but present in the word)
    this.picked = new Set()      // Set of letters that is picked, but not yet placed (yellow tile)
    this.eliminated = new Set()  // Set of letters that is not in the word (dark gray tile)

    this.targetWord = getRandomTargetWord()
    startInteraction()
    replayButton.addEventListener("click", Wordle.restartGame)
    console.log(`Starting wordle. Target word: ${this.targetWord}`)
  },

  getActiveTiles(){
    return guessGrid.querySelectorAll('[data-state="active"]')
  },

  pressKey(key) {
    const activeTiles = this.getActiveTiles()
    if (activeTiles.length >= WORD_LENGTH) return
    const nextTile = guessGrid.querySelector(":not([data-letter])")
    nextTile.dataset.letter = key.toLowerCase()
    nextTile.dataset.state = "active"
    nextTile.textContent = key
  },

  clearTile(tile){
    tile.textContent = ""
    delete tile.dataset.state
    delete tile.dataset.letter
  },

  deleteKey() {
    const activeTiles = this.getActiveTiles()
    const lastTile = activeTiles[activeTiles.length - 1]
    if (lastTile == null) return
    this.clearTile(lastTile)
  },

  submitGuess(){
    const activeTiles = [...this.getActiveTiles()]
    if (activeTiles.length !== WORD_LENGTH) {
      this.showAlert("Not long enough")
      this.shakeTiles(activeTiles)
      return
    }

    const guess = activeTiles.reduce((word, tile) => {
      return word + tile.dataset.letter
    }, "")

    if (!dictionary.includes(guess)) {
      this.showAlert("Not in word list")
      this.shakeTiles(activeTiles)
      return
    }
    this.moves.push(guess)
    stopInteraction()
    activeTiles.forEach((...params) => this.flipTile(...params, guess))
  },

  // Remove the first element from the Array
  removeArrayElement(fromArr, element){
    const ix = fromArr.indexOf(element)
    if (ix === -1) return
    fromArr.splice(ix, 1)
    return fromArr
  },

  // Called by submitGuess. Assign dataset to the tile and class to the corresponding key on the keyboard.
  flipTile(tile, index, array, guess){
    const letter = tile.dataset.letter
    const key = keyBoard.querySelector(`[data-key="${letter}"i]`)
    setTimeout(() => {
      tile.classList.add("flip")
    }, (index * FLIP_ANIMATION_DURATION) / 2)

    // Interaction is halted. Do this staggered flip drama for all tiles
    tile.addEventListener("transitionend", () => {
      tile.classList.remove("flip")
      if (this.targetWord[index] === letter) {
        this.placed[index] = letter
        // If a letter is in placed, remove it from picked.
        this.picked.delete(letter)
        // this.removeArrayElement(this.picked, letter)
        tile.dataset.state = "correct"
        key.classList.add("correct")
      } else if (this.targetWord.includes(letter)) {
        this.picked.add(letter)
        if (!this.excluded[index]) this.excluded[index] = new Set()
        this.excluded[index].add(letter)
        tile.dataset.state = "wrong-location"
        key.classList.add("wrong-location")
      } else {
        this.eliminated.add(letter)
        tile.dataset.state = "wrong"
        key.classList.add("wrong")
      }

      // Turn interaction back on if this is the last tile
      if (index === array.length - 1) {
        tile.addEventListener("transitionend", () => {
          startInteraction()
          this.checkWinLoose(guess, array)
        }, {once: true})
      }
    }, {once: true})
  },

  checkWinLoose(guess, tiles) {
    //
    // this.eliminated = [...new Set(this.eliminated)].sort((a, b) => a.localeCompare(b))
    this.status
    if (guess === this.targetWord) {
      this.showAlert("You Win", 5000)
      this.danceTiles(tiles)
      stopInteraction()
      return
    }

    const remainingTiles = guessGrid.querySelectorAll(":not([data-letter]")
    if (remainingTiles.length === 0) {
      this.showAlert(`The word was ${this.targetWord.toUpperCase()}`, null)
      stopInteraction()
    }

    const matches = refDict.getMatches(this.dictMatchOptions())
    const str = `Matches: ${matches.length}`
    popDiv.append(str)
  },

  showAlert(message, duration = 1000) {
    const alert = document.createElement("div")
    alert.textContent = message
    alert.classList.add("alert")
    alertContainer.prepend(alert)
    if (duration == null) return
    setTimeout(() => {
      alert.classList.add("hide")
      alert.addEventListener("transitionend", () => {
        alert.remove()
      })
    }, duration)
  },

  shakeTiles(tiles) {
    tiles.forEach( tile => {
      tile.classList.add("shake")
      tile.addEventListener("animationend", () => {
        tile.classList.remove("shake")
      }, {once: true})
    })
  },

  danceTiles(tiles) {
    tiles.forEach( (tile, index) => {
      setTimeout(() => {
        tile.classList.add("dance")
        tile.addEventListener("animationend", () => {
          tile.classList.remove("dance")
        }, {once: true})
      }, (index * DANCE_ANIMATION_DURATION / 5) )
    })
  },

  get status(){
    const str = `Move: ${this.moves.length},
      Placed: ${JSON.stringify(this.placed)},
      Excluded: ${JSON.stringify(this.excluded)},
      Picked: ${[...this.picked].sort((a,b) => a.localeCompare(b))}
      Eliminated: ${[...this.eliminated].sort((a,b) => a.localeCompare(b))}`
    console.log(str)
    // console.log(JSON.stringify(this.dictMatchOptions()))
    const matches = refDict.getMatches(this.dictMatchOptions())
    console.log(`Matches: ${matches.length}`)
    if (matches.length < 25) console.log(`words: ${matches}`)
  },

  get numPlaced(){
    return Object.keys(this.placed).length
  },

  get numExcluded(){
    return Object.keys(this.excluded).length
  },

  dictMatchOptions(){
    const rv = { }
    if (this.numPlaced > 0 || this.numExcluded > 0){
      rv.matches = [0,1,2,3,4].reduce((acc, ix) => {
        let chr = "?"
        if (this.placed[ix]) {
          chr = this.placed[ix]
        } else if (this.excluded[ix]) {
          chr = "X" // this.placed[ix]
        }
        return(`${acc}${chr}`)
      }, "")
    }
    if (this.picked.length > 0 ) rv.hasAll = this.picked
    if (this.eliminated.length > 0 ) rv.hasNone = this.eliminated
    return rv
  }

}

window.wl = Wordle
window.wlh = new WordleHelp(window.wl)

export default Wordle


