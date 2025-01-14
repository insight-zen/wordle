import { getRandomTargetWord } from "./target5.js";
import { dictionary } from "./dict5.js";
import { WordList } from "../lib/word_list.js"
import { WordFit } from "../lib/word_fit.js"
import { popDiv } from "../lib/pop_div.js"
import { joinSet, shakeTiles, danceTiles, showAlert, randomID,
  domE, domBtn, showBanner } from "./utils.js"

const refDict = new WordList(dictionary)
window.wlst = refDict
window.wfit = WordFit

const WORD_LENGTH = 5
const FLIP_ANIMATION_DURATION = 500
const LS_STATS_KEY = "wlprg"

// -- Game, Analytics and help

class Stats {
  constructor(input){
    input ||= JSON.parse(localStorage.getItem(LS_STATS_KEY))
    this.plays = typeof(input) == "string" ? JSON.parse(input) : input 
  }

  get numPlays() { return this.plays.length }
  get numWins() { return this.plays.length }
  get numLosts() { return this.plays.filter(p => p.result == "loose").length }
  get numAborts() { return this.plays.filter(p => p.result == "abort").length }

  message(){
    if (this.numPlays == 0) return `Stats available after playing a game`
    return `Played: ${this.numPlays}, Won: ${this.numWins}, Lost: ${this.numLosts}, Aborted: ${this.numAborts}`
  }
}

class Game  {
  constructor(wordle){
    this.wordle = wordle
    this.startAt = Date.now()

    this.state = "play"       // State of the game. Set to "won", "lost", "abort" as needed
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
    this.avCh = null // Reset available choices. They are calculated once and memoized
    this.moves.push({at: Date.now(), guess: guess})
    guess.split("").forEach((letter, index) => {
      if (this.wordle.targetWord[index] === letter) {
	this.setCorrect(index+1, letter)      } else if (this.wordle.targetWord.includes(letter)) {
	this.setWrongLocation(index+1, letter)
      } else {
	this.setWrong(letter)
      }
    })
  }

  // Holding hand and analytics
  
  get posArray(){
    return [...(new Array(WORD_LENGTH)).keys()].map(k => k+1)
  }

  get alphas() { return Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ") }

  // If input is longer than 13, add the "^" regex set prefix
  invertAlpha(input){
    return `^${this.minusArr(this.alphas, input).join("")}`
  }

  // All game stores are UPPERCASE, dictionary is lowercase
  digitRegex(input){
    const arInput = Array.from(input).sort()
    return `[${((arInput.length > 13) ? this.invertAlpha(arInput) : arInput.join("")).toLowerCase()}]`  
  }
  
  // A - B when A and B are arrays
  minusArr(aFrom, aSub) {
    return aFrom.filter(e => !aSub.includes(e))
  }
  
  // Regex that matches choices based on the current game state
  optionRegex(raw){
    // What are possible candidates for all positions
    const candidates = this.eliminated.size > 0 ?
      this.minusArr(this.alphas, Array.from(this.eliminated)) : this.alphas
    
    const rv = this.posArray.map(pos => {
      // If this position is placed, no regex. Return placed alphabet
      if (this.placed.get(pos))
	return this.digitRegex(this.placed.get(pos))
      // If there are excluded alphabets for this position remove them from candidates
      if (this.excluded.has(pos))
	return this.digitRegex(this.minusArr(candidates, Array.from(this.excluded.get(pos).values())))
      return this.digitRegex(candidates)
    })
    return raw ? rv : new RegExp(rv.join(""))
  }

  // The choice MUST include these letters. These include Picked and Placed
  get mustHave(){
    return Array.from(
      this.picked.union(new Set(this.placed.values()))
    ).map(c => c.toLowerCase())
  }

  // Using mustHaves (picked + placed) return all available anagrams
  get avAnagrams(){
    return refDict.filter({check: "hasAll", letters: this.mustHave})
  }
  
  // At the current state, with the placed letters, what the available choices
  get avChoices(){
    this.avCh ||= refDict.filter({check: "hasAll", letters: this.mustHave, pattern: this.optionRegex()})
    return this.avCh
  }

  // Given Available choices, find the top numChoices candidates for places
  placeChoices(ac, numChoices=5){
    const rv = this.posArray.map(i => {
      if (this.placed.get(i)) return
      const candidates = Object.entries(WordFit.histogram(this.avChoices.map(w => w[i-1])))
	.sort((a,b) => b[1] - a[1])
      return [i, candidates.map(e => e[0]).slice(0,numChoices)]
    }).filter(e => e)
    return new Map(rv)
  }

  // Hint candidate: These can be eliminated as they do not appear in any candidates
  get notIn(){
    return this.minusArr(
      this.minusArr(
	this.alphas,
	Array.from(new Set(Array.from(this.avChoices.join("").toUpperCase())))
      ),
      Array.from(this.eliminated)
    ).sort()
  }

  // Check the move and report its effectiveness
  anaMove(guess){
    guess = (guess ||  [...this.wordle.getActiveTiles()].map(t => t.dataset.letter)).toLowerCase()
    // Simulate a game
    const testGame = new Game({targetWord: this.wordle.targetWord})
    this.moves.forEach(m => testGame.save(m.guess))
    testGame.save(guess)
    return testGame
  }

  // Save play in LocalStorage
  savePlay({result, ...opts}={}) {
    const rv = { 
      at: Date.now(),
      result,
      time: this.duration(),
      target: this.wordle.targetWord,
      moves: this.moves.length,
      ...opts
    }
    const progArr = JSON.parse(localStorage.getItem(LS_STATS_KEY)) || []
    localStorage.setItem(LS_STATS_KEY, JSON.stringify([...progArr, rv]))
  }

  // Tips and help

  clearCache(){
    hideMenus()
    localStorage.clear()
  }
  
  stats(raw){
    hideMenus()
    const st = new Stats()
    // const rv = JSON.parse(localStorage.getItem(LS_STATS_KEY ))
    if (raw) return rv
    const btnArr = [{textContent: "Continue", click: hideAlerts}]
    showAlert({message: st.message(), duration: null, btnArr})
  }
  
  // Based on the current status, which letters should you focus on next
  letterSuggest(){
    hideMenus()
    const btnArr = [{textContent: "Continue", click: hideAlerts}]

    if (this.state == "win"){
      showAlert({message: `Hooray! You've already won this game!`, duration: null, btnArr})
      return
    }
      
    if (this.moves.length == 0){
      showAlert({message: `Available after you have made at least one attempt`, duration: null, btnArr})
      return
    }
    
    if (this.mustHave.length ==  WORD_LENGTH){
      showAlert({message: `Almost there! You have guessed all the letters. Now its anagram time!`,
	duration: null, btnArr})
      return
    }
    
    const pattern = this.optionRegex()
    const letters = Array.from(this.picked)
    const histo = wlst.histogram({wlist: wlst.filter({check: "hasAll", letters, pattern}), format: "pct"})
    const rv = Object.entries(histo).filter(e => !this.mustHave.includes(e[0]))
      .sort((a, b) => b[1] - a[1])
      .map(e => e[0].toUpperCase())
    console.log(rv)

    const msg = (this.avChoices.length < 10) ? "You are very close! " : ""
    showAlert({
      message: `${msg}For the next guess, consider letters: ${rv.join(", ")}`,
      duration: null, btnArr
    })
    
    return rv
  }
  
  // Debug and status
  
  debug(){
    const placeStr = this.posArray.map(i => this.placed.get(i) || "_").join(" ")
    const exclStr = this.posArray.map(i =>
      `${i}: ${this.placed.get(i) ? "*" : joinSet(this.excluded.get(i))}`).join(", ")

    const str = `Placed [${this.placed.size}]: ${placeStr}, Picked [${this.picked.size}]: ${joinSet(this.picked)}, Eliminated [${this.eliminated.size}]: ${joinSet(this.eliminated)}
Excluded [${this.excluded.size}]: ${exclStr}
Available choices: ${this.avChoices.length},
Can be eliminated: ${this.notIn.join(",")}`
    console.log(str)
  }
  
  helpStr(){
    const strMoves = () => {
      if (this.moves.length == 0) return "No moves yet"
      return this.moves.map(m => `<div>${this.duration(m.at)}: ${m.guess}</div>`).join("")      
    }
    
    const strPlaceChoices = this.place
    const msgStr = `
    <div>Available Choices: ${this.avChoices.length}
    <div>${strMoves()}</div>
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

function handleMouseClick(e){
  // console.log(`In Wordle.handleMouseClick`, e.target)
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

function handleKeyPress(e){
  if (e.key == "Escape"){
    hideMenus()
    hideAlerts()
    return
  }

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

// Hide menus
const hideMenus = () => document.querySelectorAll("[data-r='menu']").forEach(d => d.classList.add("hidden"))

// Hide Banners
const hideAlerts = () => document.querySelectorAll("[data-r='alert']").forEach(d => d.remove())


// All dom elements referenced by the UI
const Targets = {
  alertContainer: document.querySelector("[data-alert-container]"),
  guessGrid: document.querySelector("[data-guess-grid]"),
  keyBoard: document.querySelector("[data-keyboard]"),
  replayButton: document.querySelector("[data-replay]"),
  helpButton: document.querySelector("[data-hmenu]"),
  btnNewGame: document.querySelector("[data-new-game]"),
  liRestart: document.getElementById("liRestart"),
  liNewGame: document.getElementById("liNewGame"),
}

export const Wordle = {
  resetBoard(){
    // Remove Alerts
    // Targets.alertContainer.querySelectorAll("div").forEach(d => d.remove())

    hideMenus()
    hideAlerts()

    // Show Restart Hide New in the Left menu
    Targets.liRestart.classList.remove("hidden")
    Targets.liNewGame.classList.add("hidden")
    
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
    document.querySelectorAll(".banner").forEach(e => e.remove())
    Wordle.start(true, typeof(target) == "string" ? target : undefined)
  },

  start(noBind, target){
    if (this.helpCB) Targets.helpButton.removeEventListener("click", this.helpCB)
    this.targetWord = target || getRandomTargetWord()
    this.game = new Game(this)
    
    startInteraction()
    if (!noBind) {
      // if (!noBind) Targets.replayButton.addEventListener("click", Wordle.restartGame)
      const replayCB = Wordle.eogBanner.bind(this)
      Targets.replayButton.addEventListener("click", (event) => replayCB("abort"))
      Targets.btnNewGame.addEventListener("click", wl.restartGame)
      this.helpCB =  this.game.showHelp.bind(this.game)
      Targets.helpButton.addEventListener("click", this.helpCB)
    }
    console.log(`Starting wordle. Target word: ${this.targetWord}`)
  },

  getActiveTiles(){
    return Targets.guessGrid.querySelectorAll('[data-state="active"]')
  },

  pressKey(key) {
    hideMenus()
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

  submitGuess(guess){
    if (guess)
      Array.from(guess).forEach(k => this.pressKey(k))

    const activeTiles = [...this.getActiveTiles()]
    if (activeTiles.length !== WORD_LENGTH) {
      showAlert({message: "Not long enough"})
      shakeTiles(activeTiles)
      return
    }
    guess ||= activeTiles.reduce((word, tile) => {
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
      this.game.state = "win"
      this.game.savePlay({result: "win"})
      Targets.liRestart.classList.add("hidden")
      Targets.liNewGame.classList.remove("hidden")
      const btnArr = [{textContent: "New Game", click: wl.restartGame}]
      showAlert({
	message: `You Win in ${this.game.duration()} (${this.game.moves.length} moves)`,
	duration: null, className: "gray", btnArr
      })
      danceTiles(tiles)
      stopInteraction()
      return
    }

    const remainingTiles = Targets.guessGrid.querySelectorAll(":not([data-letter]")
    if (remainingTiles.length === 0) {
      // this.showAlert({message: `The word was ${this.targetWord.toUpperCase()}`, duration: null})
      this.eogBanner()
      stopInteraction()
      this.game.savePlay({result: "loose"})
    }
  },

  showAlert: showAlert, 
  
  eogBanner(code){
    const idNew = randomID("new")
    const idFirst = randomID("first")

    const replayCB = () => {
      console.log("Will replay game")
      Wordle.restartGame(Wordle.targetWord)      
    }
    
    const newCB = () => {
      document.getElementById(idFirst).remove()
      document.getElementById(idNew).classList.remove("hidden")
    }

    const divNewGame = () => {
      const divAns = domE({innerHTML: `The word was: <b>${Wordle.targetWord.toUpperCase()}</b>`})
      const btnNew = domBtn({
	textContent: "Continue", className: "btn",
	click:  Wordle.restartGame})      
      return domE({nodes: [divAns, btnNew], className: "flex hidden", id: idNew})
    }

    const divFirst = () => { //First div shown when banner is displays
      const btnSame = domBtn({textContent: "Replay same game",
	className: "btn",
	click: replayCB})
      const btnNew = domBtn({textContent: "See answer and New game",
	className: "btn",
	click:  newCB})
      const divBtns = domE({nodes: [btnSame, btnNew], className: "flex fl-jc-sa m-t-3"})

      
      return domE({nodes: [
	// domE({nName: "h1", textContent: "Game Over"}),
	domE({textContent: "Would you like to replay the same game or start a new game?"}),
	divBtns
      ], id: idFirst})
    }
    if (code == "abort")
      this.game.savePlay({result: code})

    showBanner({nodes: [divNewGame(), divFirst()], data: {r: "banner"}, noBtn: true})
  }
}

window.wl = Wordle
// window.banner = showBanner

// // Remove the first element from the Array
// removeArrayElement(fromArr, element){
//   const ix = fromArr.indexOf(element)
//   if (ix === -1) return
//   fromArr.splice(ix, 1)
//   return fromArr
// },
