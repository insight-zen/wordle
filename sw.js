const version = 1
const staticName = `static-${version}`
const dynamicName = `dynamic-${version}`

// const assets = ["/", "/lib/module.js", "/lib/wordle.js", "/lib/target5.js"]
// abcdef
const assets = ["/"]

// Registration > Installation > Activation
const installEH = (event) => {
  console.log(`   - SW Installation triggered`)
  event.waitUntil(
    caches.open(staticName)
      .then(cache => {
	return cache.addAll(assets).then(  // addAll = fetch + put
	  () => console.log(`  - ${staticName} has been updated`),
	  (err) => console.warn(`  - ${staticName} update failed.`, err))}))}


// Makes a fetch request and saves to cache
const customFetch = (request, opts={}) => {
  console.log(`   -- Server Fetch ${request.url}`)
  return fetch(request)
    .then( (resp) => {
      console.log(`   -- Received [${resp.status}] for ${request.url}`);
      const respCopy = resp.clone()
      caches.open(staticName).then(cache => cache.put(request, respCopy))
      return(resp)
    }, 
      (err) => { console.log(`Error in fetching ${request.url}`, err) })
}

const fetchEH = (event) => {
  event.respondWith(
    caches.match(event.request).then(cacheResp => {
      console.log(`   - Fetch ${cacheResp ? 'YES' : ' NO'} ${event.request.url}`)
      return cacheResp || customFetch(event.request)})
  )
}

const activateEH = (event) => {
  const clean = true
  console.log(`  - SW version ${version} will be user, on activation will${clean ? '' : ' NOT' } purge old caches.`)

  // Delete old caches
  const purgeOldCaches = () => {
    caches.keys().then( (keys) => { 
      Promise.all(keys.filter(key => key != staticName).map(key => caches.delete(key)))})}

  if (clean) purgeOldCaches()
}

const messageEH = (event) => {
  console.log(`  - Message Event`)
}


self.addEventListener("install", installEH)

self.addEventListener("activate", activateEH)

self.addEventListener("fetch", fetchEH)

self.addEventListener("fetch", messageEH)
