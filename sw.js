const version = 4
const staticName = `static-${version}`
const dynamicName = `dynamic-${version}`

const logLevel = 0

// const assets = ["/", "/lib/module.js", "/lib/wordle.js", "/lib/target5.js"]
// abcdef
const assets = [] // file here

// Registration > Installation > Activation
//
// ev.waitUntil() : Await inside event Handler. Waits for the promise to resolve
//   - can be called in any eventEH
//   - e.g. prefetch assets in install, purge caches in activate
//
// self.skipWaiting() : Go ahead and activate right away.
//   - Without this all tabs have to close in the browser for the new version to activate
//   - Same was clicking on "skip waiting" in devtools.
//   - called in installEH
//
// clients.claim() : Take over existing clients.
//   - called from activateEH
//
const installEH = (event) => {
  console.log(`   - SW Installation triggered`)
  self.skipWaiting()
  event.waitUntil(
    caches.open(staticName)
      .then(cache => {
	return cache.addAll(assets).then(  // addAll = fetch + put
	  () => console.log(`  - ${staticName} has been updated`),
	  (err) => console.warn(`  - ${staticName} update failed.`, err))}))}

// Makes a fetch request and saves to cache
const customFetch = (request, opts={}) => {
  if (logLevel > 0) console.log(`   -- Server Fetch ${request.url}`)
  return fetch(request)
    .then( (resp) => {
      if (logLevel > 0) console.log(`   -- Received [${resp.status}] for ${request.url}`);
      const respCopy = resp.clone()
      if (!opts.noSave) caches.open(staticName).then(cache => cache.put(request, respCopy))
      return(resp)
    }, 
      (err) => { console.log(`Error in fetching ${request.url}`, err) })
}

const fetchEH = (event) => {
  event.respondWith(
    caches.match(event.request).then(cacheResp => {
      if (logLevel > 0) console.log(`   - Fetch ${cacheResp ? 'YES' : ' NO'} ${event.request.url}`)
      return cacheResp || customFetch(event.request, {noSave: true})}))}

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

self.addEventListener("message", messageEH)
