// Dictionary
// Import this module and set the dictionary reference to =sd=
// let {ScrabDict: sd}  = await import("./lib/scrab_dict.js")
// Init actually loads the words
// await sd.init()


// Map that holds roots for anagrams in a set
class RootMap {
  constructor(words, opts={}){
    this.store = new Map()
    this.build(words)
  }

  // Split chars, sort, join.
  // Two words are anagrams if their roots match
  root(input){
    return input.split("").sort().join("")    
  }

  get size() {
    return this.store.size
  }

  has(key) {
    return this.get(key) ? true : false
  }
  
  get(key) {
    return this.store.get(key)
  }

  build(wordArr){
    wordArr.forEach(w => {
    const rWord = this.root(w)
    const cv = this.store.get(rWord)
      this.store.set(rWord, cv ? [...cv, w].filter(w => w) : [w])
    })
  }

  stats(){
    const histogram = [...this.store.keys()]
      .reduce((acc, item) => {
	acc[item.length] = (acc[item.length] || 0) + 1
	return acc
      }, {})
    return histogram
  }

  // FiltFunc gets (key, arrWords)
  filter(input){
    let useFn
    if (!input)
     useFn = ([key, wordArr]) =>  key.length == 7
    else if (input instanceof Function)
      useFn = input
    else if ("length" in input)
      useFn = ([key, wordArr]) =>  key.length == (input.length || 5)
    return new Map([...this.store.entries()].filter(useFn))
  }
  
}

export const ScrabDict = {
  wordArr: [],
  // rootMap: new Map(),

  async loadWords(){
    if (ScrabDict.wordArr.length > 0) return
    let js  = await import("./scrab_words.js")
    ScrabDict.wordArr = js.ScrbWords
  },

  async init(all){
    await ScrabDict.loadWords()
    if (all) ScrabDict.rootMap = new RootMap(ScrabDict.wordArr)
  },

  get status(){
    return ` * Words: ${ScrabDict.wordArr.length}, Anagrams: ${ScrabDict.rootMap.size}`
  }, 
  
  includes(input){
    return ScrabDict.wordArr.includes(input.toUpperCase())
  },

  // // Split chars, sort, join.
  // // Two words are anagrams if their roots match
  // root(input){
  //   return input.split("").sort().join("")    
  // },
  
  getAnagrams(input){
    ScrabDict.buildrootMap()
    const root = ScrabDict.root(input.toUpperCase())
    return ScrabDict.rootMap.get(root)
  },

  // // Randomly chosen word from the given array
  // randIndex(length) { 
  //   return Math.floor(Math.random()*length)
  // },

  // // Randomly chosen word from the given array
  // random(wordArr) { 
  //   return wordArr[ScrabDict.randIndex(wordArr.length)]
  // },
    
}


//

// const sd = ScrabDict

// await sd.init(true)
// console.log(` * Words: ${sd.wordArr.length}, Anagrams: ${sd.rootMap.size}`)
// console.log("Anagrams: ", sd.getAnagrams("faith"))
