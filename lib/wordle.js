import { getRandomTargetWord } from "./target5.js";
import { dictionary } from "./dict5.js";
import { WordList } from "../lib/word_list.js"
import { popDiv } from "../lib/pop_div.js"
import { joinSet, shakeTiles, danceTiles, showAlert } from "./utils.js"

const refDict = new WordList(dictionary)
window.wlst = refDict

// -- Wordle Analytics and help

class Game  {
  constructor(wordle){
    this.wordle = wordle
    this.startAt = Date.now()

    this.moves = []           // Array of moves, stored in the order of attempts
    this.placed = new Map()   // Map of placed letters. by index (green tiles)
    this.picked = new Set()   // Set of letters that is picked, but not yet placed (yellow tiles)
    this.eliminated = new Set()  // Set of letters that is not in the word (dark gray tile)
    this.excluded = new Map()    // Map of excluded letters by index (but present in the word)
    wordle.game = this
  }
  
  duration(at=Date.now()){
    const padDigit = (num, padding=2) => num.toString().padStart(padding, "0")
    const delta = Math.floor( (at - this.startAt) / 1000)
    const minutes = Math.floor(delta / 60)
    const seconds = delta % 60
    return `${padDigit(minutes)}:${padDigit(seconds)}`
  }

  setCorrect(index, letter) {
    this.placed.set(index, letter.toUpperCase())
    this.placed.values().forEach(l => this.picked.delete(l))
    // Once a correct letter if found, the excluded set is no longer needed
    if (this.excluded.get(index)) this.excluded.set(index, "*")
  }

  setWrongLocation(index, letter) {
    // Create the excluded index, only if the correct letter is not found for the index
    if (!this.placed.get(index)) {
      if (!this.excluded.get(index)) this.excluded.set(index, new Set())
      this.excluded.get(index).add(letter.toUpperCase())
    }
    this.picked.add(letter.toUpperCase())
  }

  setWrong(letter) {
    this.eliminated.add(letter.toUpperCase())
  }

  // A valid is guess was entered
  save(guess){
    this.moves.push({at: Date.now(), guess: guess})
    guess.split("").forEach((letter, index) => {
      if (this.wordle.targetWord[index] === letter) {
	this.setCorrect(index+1, letter)
      } else if (this.wordle.targetWord.includes(letter)) {
	this.setWrongLocation(index+1, letter)
      } else {
	this.setWrong(letter)
      }
    })
  }
  
  strMoves(){
    if (this.moves.length == 0) return "No moves yet"
    return this.moves.map(m => `<div>${this.duration(m.at)}: ${m.guess}</div>`).join("")
  }

  debug(){
    const placeStr = [1,2,3,4,5].map(i => this.placed.get(i) || "_").join(" ")
    const exclStr = [1,2,3,4,5].map(i =>
      `${i}: ${this.placed.get(i) ? "*" : joinSet(this.excluded.get(i))}`).join(", ")

    const str = `Placed [${this.placed.size}]: ${placeStr}
Picked [${this.picked.size}]: ${joinSet(this.picked)}
Eliminated [${this.eliminated.size}]: ${joinSet(this.eliminated)}
Excluded [${this.excluded.size}]: ${exclStr}`
    console.log(str)
  }
  
  helpStr(){
    const msgStr = `
    <div>${this.strMoves()}</div>
    `
    return msgStr
  } 
  
  showHelp(){
    popDiv.toggle(this.helpStr())
  }
}

// -- Top level Event listeners and click/key handlers.

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

// -- Wordle Constant

const WORD_LENGTH = 5
const FLIP_ANIMATION_DURATION = 500

// All dom elements referenced by the UI
const Targets = {
  alertContainer: document.querySelector("[data-alert-container]"),
  guessGrid: document.querySelector("[data-guess-grid]"),
  keyBoard: document.querySelector("[data-keyboard]"),
  replayButton: document.querySelector("[data-replay]"),
  helpButton: document.querySelector("[data-hmenu]")
}

export const Wordle = {
  resetBoard(){
    // Remove Alerts
    Targets.alertContainer.querySelectorAll("div").forEach(d => d.remove())
    
    // Reset keyboard
    Targets.keyBoard.querySelectorAll("button.key").forEach(b => {
      ["wrong", "wrong-location", "correct"].forEach(c => b.classList.remove(c))
    })

    // Reset guesses
    Targets.guessGrid.querySelectorAll("div.tile").forEach(tile => Wordle.clearTile(tile))
  }, 
  
  restartGame(target){
    Targets.replayButton.blur()
    stopInteraction()
    Wordle.resetBoard()
    showAlert({message: "Restarting the game...", duration: 500 , klass: "go", noTrans: true})
    Wordle.start(true, typeof(target) == "string" ? target : undefined)
  },

  start(noBind, target){
    if (this.helpCB) Targets.helpButton.removeEventListener("click", this.helpCB)
    this.targetWord = target || getRandomTargetWord()
    this.game = new Game(this)
    
    startInteraction()
    if (!noBind) Targets.replayButton.addEventListener("click", Wordle.restartGame)
    this.helpCB =  this.game.showHelp.bind(this.game)
    Targets.helpButton.addEventListener("click", this.helpCB)
    console.log(`Starting wordle. Target word: ${this.targetWord}`)
  },

  getActiveTiles(){
    return Targets.guessGrid.querySelectorAll('[data-state="active"]')
  },

  pressKey(key) {
    const activeTiles = this.getActiveTiles()
    if (activeTiles.length >= WORD_LENGTH) {
      showAlert({message: "Press RETURN to submit or DELETE to edit"})
      shakeTiles(activeTiles)
      return
    }
    const nextTile = Targets.guessGrid.querySelector(":not([data-letter])")
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
      showAlert({message: "Not long enough", duration: null})
      shakeTiles(activeTiles)
      return
    }

    const guess = activeTiles.reduce((word, tile) => {
      return word + tile.dataset.letter
    }, "")

    if (!dictionary.includes(guess)) {
      showAlert({message: "Not in word list"})
      shakeTiles(activeTiles)
      return
    }
    this.game.save(guess)
    stopInteraction()
    activeTiles.forEach((...params) => this.flipTile(...params, guess))
    console.log(this.game.debug())
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
    const key = Targets.keyBoard.querySelector(`[data-key="${letter}"i]`)
    setTimeout(() => {
      tile.classList.add("flip")
    }, (index * FLIP_ANIMATION_DURATION) / 2)

    const setState = (tile, key, state) => {
        tile.dataset.state = state
        key.classList.add(state)
    }
    
    // Interaction is halted. Do this staggered flip drama for all tiles
    tile.addEventListener("transitionend", () => {
      tile.classList.remove("flip")
      if (this.targetWord[index] === letter) {
	setState(tile, key, "correct")
      } else if (this.targetWord.includes(letter)) {
	setState(tile, key, "wrong-location")
      } else {
	setState(tile, key, "wrong")
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
    if (guess === this.targetWord) {
      showAlert({message: `You Win in ${this.game.duration()} (${this.game.moves.length} moves)`, duration: null, klass: "go"})
      danceTiles(tiles)
      stopInteraction()
      return
    }

    const remainingTiles = Targets.guessGrid.querySelectorAll(":not([data-letter]")
    if (remainingTiles.length === 0) {
      this.showAlert({message: `The word was ${this.targetWord.toUpperCase()}`, duration: null})
      stopInteraction()
    }
  },
}

//
class WordleHelp {

  // // Words from the dictionary that do no include already eliminated chars
  // eliminators(){
  //   return refDict.words.filter(dw =>
  //     this.wordle.eliminateddw.length === inputLength && inputChars.every(c => dw.includes(c)) )

  // }

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

window.wl = Wordle



