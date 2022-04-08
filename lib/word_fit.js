// Library to check if a word fits the criteria

const WordFit = {
  wordArr(word){
    return word.split("")
  },

  toArr(word){
    return typeof(word) === "string" ? word.split("") : word
  },

  // Does the word have the ALL the letters. Word may contain other alphabets in addition to letters
  hasAll(word, letters){
    const wordArray = this.toArr(word)
    const letterArray = this.toArr(letters)
    return letterArray.every(c => wordArray.includes(c))
  },

  // Does the word have the SOME (at least one) of the letters
  hasSome(word, letters){
    const wordArray = this.toArr(word)
    const letterArray = this.toArr(letters)
    return letterArray.some(c => wordArray.includes(c))
  },

  // Does the word have the NONE letters
  hasNone(word, letters){
    return !this.hasSome(word, letters)
  },

  // Word is made up ONLY of alphabets in letters. No alphabets other than letters are allowed.
  // letters may be repeated in word.
  hasOnly(word, letters){
    const wordArray = this.toArr(word)
    const letterArray = this.toArr(letters)
    return wordArray.every(c => letterArray.includes(c))
  },

  regex(word, pattern){
    const patternRegex = new RegExp(pattern)
    return(word.match(patternRegex) ? true : false)
  },

  matches(word, pattern, patternLength=null){
    // If pattern does not have a wildcard spec, calculate the token length
    if ((!pattern.match(/\*/)) && !patternLength) patternLength = pattern.length
    pattern = pattern.toLowerCase()
    pattern = pattern.replaceAll("?", "\\w")
    // Match * only if not preceded by . - Negative lookbehind assertion: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions/Cheatsheet
    // "abc*".match(/(?<!\.)\*/) => true
    // "ab.*".match(/(?<!\.)\*/) => false
    pattern = pattern.replaceAll(/(?<!\.)\*/g, ".*")

    if (patternLength && patternLength != word.length) return(false)
    const patternRegex = new RegExp(pattern)
    return(word.match(patternRegex) ? true : false)
  }
}

export default WordFit
window.wordFit = WordFit