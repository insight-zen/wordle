// Library to check if a word fits the criteria

export const WordFit = {
  wordArr(word){
    return word.split("")
  },

  toArr(word){
    return typeof(word) === "string" ?  Array.from(word) : word
  },

  // ALL the letters are in the word. Word may contain other alphabets in addition to letters
  // Word can have multiple copies of a letter. So only unique letters are checked for presence
  hasAll(word, letters){
    const wordArray = this.toArr(word.toLowerCase())
    const letterArray = this.toArr(letters)
    return letterArray.every(c => wordArray.includes(c.toLowerCase()))
  },

  // SOME (at least one) of the letters are in the word
  hasSome(word, letters){
    const wordArray = this.toArr(word)
    const letterArray = this.toArr(letters)
    return letterArray.some(c => wordArray.includes(c))
  },

  // NONE of the letters are in the word
  hasNone(word, letters){
    return !this.hasSome(word, letters)
  },

  histogram(items){
    return items.reduce((acc, i) => { acc[i] = (acc[i] || 0) +1; return acc}, {})  }, 
    
  // Exact check - if II is specified, two I's are present
  // hasExact("ROARS", "RS")  => false  : Word has 2 R's, letters have 1
  // hasExact("ROARS", "RRR") => false  : Word has 2 R's, letters have 3
  // hasExact("ROARS", "SM")  => false  : Word does not have "M" which letters have
  // hasExact("ROARS", "RRS")  => true  : letters do not need to make the complete word
  // hasExact("ROARS", "AORRS")  => true  : Same letters, order does not matter
  // 
  hasExact(word, letters){
    const lettersHist = this.histogram(this.toArr(letters))
    const wordHist = this.histogram(this.toArr(word))
    return Object.entries(lettersHist).reduce((acc, [letter, count]) => acc && wordHist[letter] && wordHist[letter] == count, true)
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
    if (typeof(pattern) == "string") {
      // If pattern does not have a wildcard spec, calculate the token length
      if ((!pattern.match(/\*/)) && !patternLength) patternLength = pattern.length
      pattern = pattern.toLowerCase()
      pattern = pattern.replaceAll("?", "\\w")
      // Match * only if not preceded by . - Negative lookbehind assertion: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions/Cheatsheet
      // "abc*".match(/(?<!\.)\*/) => true
      // "ab.*".match(/(?<!\.)\*/) => false
      pattern = pattern.replaceAll(/(?<!\.)\*/g, ".*")

      if (patternLength && patternLength != word.length) return(false)
    }
    const patternRegex = (typeof(pattern) == "string") ? new RegExp(pattern) : pattern
    return(word.match(patternRegex) ? true : false)
  }
}

// export default WordFit
// window.wordFit = WordFit
