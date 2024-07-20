import { ScrabDict } from "./scrab_dict.js"
import { randWord, shuffle, permute, shakeTiles, danceTiles, showAlert } from "./utils.js"


const WORD_LENGTH = 6
const GUESS_ROWS = 1

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
    handleKeyPress({key: e.target.dataset.key}, e.target)
    return
  }

  if (e.target.matches("[data-enter]")) {
    handleKeyPress({key: "Enter"}, e.target)
    return
  }

  // Delete button includes an SVG.
  if (e.target.matches("[data-delete]") || e.target.closest("[data-delete]")) {
    handleKeyPress({key: "Delete"}, e.target)
    return
  }
}

function handleKeyPress(e, btn) {
  if (e.key === "Enter") {
    Board.enterKey()
    return
  }

  if (e.key === "Backspace" || e.key === "Delete") {
    Board.deleteKey()
    return
  }

  if (e.key.match(/^[a-z]$/i)) {
    Board.pressKey(e.key, btn)
    return
  }
}


const Board = {
  // IDs of key elements of the board
  components: {
    wrap: "wrap",		// All game play happens in this wrapper
    rack: "rack",		// Characters given to you
    attempt: "attempt",		// Attempt area
    answers: "answers",		// Your guesses/answers
    btnReplay: "btnReplay",
    btnHelp: "btnHelp"
  },
      
  cbReplay(){
    console.log("Replay handler")
    AG.getGuess()
    Board.setupRack()
  },

  cbHelp(){
    console.log("Help handler")
  }, 

  setupRack(){
    const btnEnter = `<button class="key large enter" data-enter>Enter</button>`
    const btnDel = `<button class="key large" data-delete><svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path fill="var(--color-tone-1)" d="M22 3H7c-.69 0-1.23.35-1.59.88L0 12l5.41 8.11c.36.53.9.89 1.59.89h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H7.07L2.4 12l4.66-7H22v14zm-11.59-2L14 13.41 17.59 17 19 15.59 15.41 12 19 8.41 17.59 7 14 10.59 10.41 7 9 8.41 12.59 12 9 15.59z"></path></svg></button>`

    const arrHtml = [
      btnEnter, 
      Array.from({length: WORD_LENGTH}).map((e, ix) =>
	`<button data-key="${AG.game.tiles[ix]}" class="key">${AG.game.tiles[ix]}</button>`).join(""),
      btnDel
    ]

    Board.divRack.innerHTML = arrHtml.join("")
  },
  
  // Run the very first time to add elements to the page
  setup(){
    Board.divWrap = document.getElementById(Board.components.wrap)
    Board.divRack = document.getElementById(Board.components.rack)
    Board.divAttempt = document.getElementById(Board.components.attempt)
    Board.divAnswers = document.getElementById(Board.components.answers)

    Board.divWrap.style = `${Board.divWrap.attributesstyle}; --ncols: ${WORD_LENGTH};`
    Board.divRack.style = `${Board.divWrap.attributesstyle}; --ncols: ${WORD_LENGTH+4};`
    
    const strTile = `<div class="tile"></div>`
    Board.divAttempt.insertAdjacentHTML("beforeend", Array.from({length: WORD_LENGTH * GUESS_ROWS}).map((e, ix) => strTile).join(""))
    AG.getGuess()

    Board.setupRack()
    document.getElementById(Board.components.btnReplay)?.addEventListener("click", Board.cbReplay)
    document.getElementById(Board.components.btnHelp)?.addEventListener("click", Board.cbHelp)
    
    startInteraction()
  },

  firstAvailableTile(){
    return Board.divAttempt.querySelector("div.tile:not([data-state='active'])")
  },

  // Returns the array of chars currently attempted 
  attemptChars(){
    return [...Board.divAttempt.querySelectorAll("div.tile[data-state='active']")]
      .map(t => t.textContent)
      .filter(t => t)
  },
  
  // Only keys from the rack may be used
  // Duplicates are checked by comparing keys used in the attempt with keys given in the rack
  validKeys(){
    const rv = [...AG.game.tiles]
    Board.attemptChars().forEach(t => {
      if (rv.indexOf(t) != -1)
	rv[rv.indexOf(t)] = null
    })
    return rv.filter(t => t)
  },
  
  pressKey(key, btn){
    key = key.toUpperCase()
    // Make sure key is one of the tiles
    if (!Board.validKeys().includes(key)) {
      showAlert({message: `${key} is not an available choice`})
      return
    }
    
    // Write to key to the first empty tile in Attempt
    const t = Board.firstAvailableTile()
    if (!t) console.log(`NO FREE TILES`)
    t.textContent = key
    t.dataset.state = "active"
    if (btn) btn.classList.add("wrong")
  },

  resetTile(tile){
    if (!tile) return
    tile.textContent = ""
    delete tile.dataset.state
  },
  
  deleteKey(key){
    const activeTiles = Board.divAttempt.querySelectorAll("div.tile[data-state='active']")
    if (!activeTiles) return
    Board.resetTile(activeTiles[activeTiles.length-1])
    const usedButtons = Board.divRack.querySelectorAll("button.key.wrong")
    if (usedButtons.length > 0) usedButtons[usedButtons.length-1].classList.remove("wrong")

  },

  enterKey(key){
    const answer = Board.attemptChars().join("")
    if (AG.game.responses.includes(answer)){
      showAlert({message: "Already answered with this choice."})
      return
    }
    
    if (AG.game.answers.includes(answer)){
      AG.game.responses.push(answer)
      const ansStr = AG.game.responses.sort((a, b) => b.length - a.length).map(t => `<div class="response">${t}</div>`)
      Board.divAnswers.innerHTML = ansStr.join("")
      Board.divAttempt.querySelectorAll("div.tile").forEach(t => Board.resetTile(t))
      Board.divRack.querySelectorAll("button.key").forEach(b => b.classList.remove("wrong"))
    } else {
      showAlert({message: "Word not recognized. Incorrect Answer"})
      shakeTiles(Board.divAttempt.querySelectorAll("div.tile"))
    }
  },
}


// Anagram Game container
const AG = {
  game: {},
  board: Board,
  
  async init(){
    await ScrabDict.init(true)
    AG.dict = ScrabDict

    window.ag = AG
  },
  
  getGuess(){
    const choices = AG.dict.rootMap.filter({length: WORD_LENGTH})
    AG.game.choice = randWord([...choices.keys()])
    AG.game.answers = AG.getAnswers(AG.game.choice)
    AG.game.tiles = shuffle(AG.game.choice)
    AG.game.responses = []
    console.log(`WL: ${WORD_LENGTH}, Chose: ${AG.game.choice}, Shuffled: ${AG.game.tiles}`)
    console.log(`Answers: ${AG.game.answers.length}`, AG.game.answers)
  },

  // Returns valid words that can be formed using characters in the given str
  getAnswers(str=AG.choice){
    const rv = permute(str).map( w => w.split("").sort().join(""))
    return Array.from(new Set(rv)).sort((a,b) => a.length - b.length)
      .filter(w => ag.dict.rootMap.has(w))
      .map(w => ag.dict.rootMap.get(w).flat()).flat()
      .sort((a,b) => b.length - a.length)
  }
}
  
await AG.init()
// window.addEventListener("DOMContentLoaded", Board.setup)
Board.setup() // AG.play()

