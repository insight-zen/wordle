import { WordFit } from "./word_fit.js"

export class WordList {

  constructor(words=[]){
    this.words = words
  }

  // Runs METHOD on all words
  fitCheck(method, input){
    if(!Object.keys(WordFit).includes(method)) throw(`Unknown check: "${method}". Known checks are: ${Object.keys(WordFit).sort()}`)
    return this.words.filter( w => WordFit[method](w, input.toLowerCase()))
  }

  // Return occurances of each alphabet. Multiple placements in a word are counted as multiple occurances
  // Hence format="pct" will return numbers more than 100 for most common alphabets
  histogram({wlist= this.words, format= "raw", ...opts}={}){
    const rv = wlist.reduce((acc, word) => {
      const rv = WordFit.histogram(WordFit.toArr(word))
      Object.entries(rv).forEach(([alpha, count]) => acc[alpha] = (acc[alpha] || 0) + 1)
      return acc
    }, {})
    if (format == "raw") return rv
    return this.normalizedHistogram(rv, 2)
    // const totWords = Object.values(rv).reduce((acc,i) => acc + i, 0)
    // return Object.fromEntries(Object.entries(rv).map(([alpha, count]) => [alpha, (100*count / totWords).toFixed(2)]))
  }

  // Input is a histogram in the form of key => count. Returns key => pct
  normalizedHistogram(input, precision=0){
    const totCount = Object.values(input).reduce((acc,i) => acc + i, 0)
    return Object.fromEntries(Object.entries(input).map(([pos,count]) => [pos, (100.0*count/totCount).toFixed(precision)]))
  }
  
  // For each alphabet, returns occurances by placement
  placements({wlist=this.words}={}){
    const rv = wlist.reduce((acc, word) => {
      WordFit.toArr(word).forEach((alpha, place) => {
	acc[alpha] ||= {}
	acc[alpha][place+1] = (acc[alpha][place+1] || 0) + 1
      })
      return acc
    }, {})
    return Object.fromEntries(Object.entries(rv).map(([alpha, posHist]) =>
      [alpha, this.normalizedHistogram(posHist,0)]))
  }
  
  getMatches(opts={}){
    let rv = this.words // .filter( w => WordFit[check](w, letters))
    // console.log(Object.entries(opts))
    Object.entries(opts).forEach(([check, pattern]) => {
      // console.log(`check = ${check}, pattern = ${pattern}`)
      rv = rv.filter(w => WordFit[check](w, pattern))
    })
    return rv
  }

  matchRegex(regex){
    return this.words.filter( w => WordFit.matches(w, regex))
  }
  
  filter({letters, check = "hasSome", pattern=null}={}) {
    if(!Object.keys(WordFit).includes(check)) throw(`Unknown check: "${check}". Known checks are: ${Object.keys(WordFit)}`)
    if (!letters && pattern)
      return this.words.filter( w => WordFit.matches(w, pattern))

    const rv = letters ? this.words.filter( w => WordFit[check](w, letters)) : this.words
    if (!pattern) return rv
    return rv.filter( w => WordFit.matches(w, pattern))
  }

  // Return the count of words that start with an alphabet
  get startGroups(){
    const rv = this.words.reduce((acc, item) => {
      const key = item[0]
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})
    return(rv)
  }

  // Return the count of words of certain lengths
  get lengthGroups(){
    const rv = this.words.reduce((acc, item) => {
      const key = item.length
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})
    return(rv)
  }

  info() {
    console.log(`WordList built using ${this.fileName} with ${this.words.length} words`)
  }

}

// export default WordList
