// Checking a given word against various conditions
class WordCheck {

  constructor(word){
    this.word = word
  }

  get wordLength(){
    return this.word.length
  }

  beginsWith(token){
    return this.word.match(new RegExp(`^${token}`)) ? true : false
  }

  endsWith(token){
    return this.word.match(new RegExp(`${token}$`)) ? true : false
  }

  // "a?is"
  matches(regexStr){
    return this.word.match(new RegExp(regexStr)) ? true : false
  }

  // Is every element of tokenArr present in the word? Position doesn't matter
  every(tokenArr){
    tokenArr.every(e => wArray.includes(e) )
  }

  // Interpret the token and return true/false based on the match
  // '?' is placeholder for one character
  // '*' is placeholder for zero or more characters
  //
  // Examples:
  //   "?c?i?n" - six letter word, second, fourth, sixth character c, i, n respectively
  //   "a?c*"   - first letter: a, third letter: c - any length greater than 3
  //            - is identical to "a?c.*"
  detect(token, tokenLength=null){
    // If a token does not have a wildcard spec, calculate the token length
    if ((!token.match(/\*/)) && !tokenLength) tokenLength = token.length
    token = token.toLowerCase()
    token = token.replaceAll("?", "\\w")
    // Match * only if not preceded by . - Negative lookbehind assertion: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions/Cheatsheet
    // "abc*".match(/(?<!\.)\*/) => true
    // "ab.*".match(/(?<!\.)\*/) => false
    token = token.replaceAll(/(?<!\.)\*/, ".*")

    if (tokenLength && tokenLength != this.wordLength) return(false)
    const result = this.matches(token)
    // console.log(`token: ${token}, tokenLength: ${tokenLength}, word: ${this.word}, wordLength: ${this.wordLength}, Result: ${result}`)
    return(result)
  }

  static passes(word, token, tokenLength=null){
    const wc = new WordCheck(word)
    return wc.detect(token, tokenLength)
  }

}

export default WordCheck