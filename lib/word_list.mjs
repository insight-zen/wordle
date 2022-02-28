// To use this in nodejs repl using Dynamic import -
// https://v8.dev/features/dynamic-import
// You have to use the default property of the imported module
// https://stackoverflow.com/questions/58858782/using-the-dynamic-import-function-on-node-js/58859327#58859327
// const moduleA = await import('./moduleA');
// moduleA.default();
// Or destructure in the import call:
// const { default: WordList } = await import ("./lib/word_list.mjs")
// const wl = new WordList()
// console.log(`List has ${wl.words.length} words`)

import { readFileSync } from 'fs';
// import * from "word_check";
const { default: WordCheck } = await import ("./word_check.mjs")

function readFile(file_name){
  const txt = readFileSync(file_name, "utf-8");
  return txt.split("\n")
}

class WordList {

  constructor(opts={}){
    Object.assign(this, {fileName: "./dict/popular.txt"}, opts);
    this.words = readFile(this.fileName)
  }

  detect(token, tokenLength=null){
    this.words.filter( w => WordCheck.passes(w, token, tokenLength) )
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

export default WordList