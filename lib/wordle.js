import { targetWords } from "./target5.js";
import { dictionary } from "./dict5.js";

export default class Wordle { }

const WORD_LENGTH = 5
const FLIP_ANIMATION_DURATION = 500
const DANCE_ANIMATION_DURATION = 500

const alertContainer = document.querySelector("[data-alert-container]")
const guessGrid = document.querySelector("[data-guess-grid]")
const keyBoard = document.querySelector("[data-keyboard]")
const replayButton = document.querySelector("[data-replay]")

function getTargetWord(y=2022, m=0, d=1) {
  const offsetFromDate = new Date(y, m, d)
  const msOffset = Date.now() - offsetFromDate
  const dayOffset = msOffset / (60 * 60 * 24 * 1000)
  return targetWords[Math.floor(dayOffset)]
}

function getRandomTargetWord(){
  const newWord = targetWords[Math.floor(Math.random()*targetWords.length)]
  console.log(`Setting target to: ${newWord}`)
  return newWord
}

// let targetWord = getTargetWord()
let targetWord = getRandomTargetWord()

function restartGame(){
  targetWord = getRandomTargetWord()
  const tiles = guessGrid.querySelectorAll("div")
  tiles.forEach(tile => clearTile(tile))
  const keys = keyBoard.querySelectorAll("button")
  keys.forEach(key => key.classList.remove("wrong", "wrong-location", "correct"))
  const alerts = alertContainer.querySelectorAll("div")
  alerts.forEach(alert => alert.remove())
  startInteraction()
}

replayButton.addEventListener("click", restartGame)

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
    pressKey(e.target.dataset.key)
    return
  }

  if (e.target.matches("[data-enter]")) {
    submitGuess()
    return
  }

  if (e.target.matches("[data-delete]")) {
    deleteKey()
    return
  }
}

function handleKeyPress(e) {
  if (e.key === "Enter") {
    submitGuess()
    return
  }

  if (e.key === "Backspace" || e.key === "Delete") {
    deleteKey()
    return
  }

  if (e.key.match(/^[a-z]$/)) {
    pressKey(e.key)
    return
  }
}

function getActiveTiles(){
  return guessGrid.querySelectorAll('[data-state="active"]')
}

function pressKey(key) {
  const activeTiles = getActiveTiles()
  if (activeTiles.length >= WORD_LENGTH) return
  const nextTile = guessGrid.querySelector(":not([data-letter])")
  nextTile.dataset.letter = key.toLowerCase()
  nextTile.dataset.state = "active"
  nextTile.textContent = key
}

function clearTile(tile){
  tile.textContent = ""
  delete tile.dataset.state
  delete tile.dataset.letter
}

function deleteKey() {
  const activeTiles = getActiveTiles()
  const lastTile = activeTiles[activeTiles.length - 1]
  if (lastTile == null) return
  clearTile(lastTile)
}

function submitGuess(){
  const activeTiles = [...getActiveTiles()]
  if (activeTiles.length !== WORD_LENGTH) {
    showAlert("Not long enough")
    shakeTiles(activeTiles)
    return
  }

  const guess = activeTiles.reduce((word, tile) => {
     return word + tile.dataset.letter
  }, "")

  if (!dictionary.includes(guess)) {
    showAlert("Not in word list")
    shakeTiles(activeTiles)
    return
  }
  stopInteraction()
  activeTiles.forEach((...params) => flipTile(...params, guess))
}

function flipTile(tile, index, array, guess){
  const letter = tile.dataset.letter
  const key = keyBoard.querySelector(`[data-key="${letter}"i]`)
  setTimeout(() => {
    tile.classList.add("flip")
  }, (index * FLIP_ANIMATION_DURATION) / 2)

  // Interaction is halted. Do this staggered flip drama for all tiles
  tile.addEventListener("transitionend", () => {
    tile.classList.remove("flip")
    if (targetWord[index] === letter) {
      tile.dataset.state = "correct"
      key.classList.add("correct")
    } else if (targetWord.includes(letter)) {
      tile.dataset.state = "wrong-location"
      key.classList.add("wrong-location")
    } else {
      tile.dataset.state = "wrong"
      key.classList.add("wrong")
    }

    // Turn interaction back on if this is the last tile
    if (index === array.length - 1) {
      tile.addEventListener("transitionend", () => {
        startInteraction()
        checkWinLoose(guess, array)
      }, {once: true})
    }
  }, {once: true})
}

function checkWinLoose(guess, tiles) {
  if (guess === targetWord) {
    showAlert("You Win", 5000)
    danceTiles(tiles)
    stopInteraction()
    return
  }

  const remainingTiles = guessGrid.querySelectorAll(":not([data-letter]")
  if (remainingTiles.length === 0) {
    showAlert(`The word was ${targetWord.toUpperCase()}`, null)
    stopInteraction()
  }
}

function showAlert(message, duration = 1000) {
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
}

function shakeTiles(tiles) {
  tiles.forEach( tile => {
    tile.classList.add("shake")
    tile.addEventListener("animationend", () => {
      tile.classList.remove("shake")
    }, {once: true})
  })
}

function danceTiles(tiles) {
  tiles.forEach( (tile, index) => {
    setTimeout(() => {
      tile.classList.add("dance")
      tile.addEventListener("animationend", () => {
        tile.classList.remove("dance")
      }, {once: true})
    }, (index * DANCE_ANIMATION_DURATION / 5) )
  })
}

startInteraction()
