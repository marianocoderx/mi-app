// Caché de datos descargados en IndexedDB. Si algo falla, simplemente no cachea.
const DB = 'data-cache-v1'
const STORE = 'series'

function open() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('Sin IndexedDB'))
    const r = indexedDB.open(DB, 1)
    r.onupgradeneeded = () => r.result.createObjectStore(STORE)
    r.onsuccess = () => resolve(r.result)
    r.onerror = () => reject(r.error)
  })
}

export async function cacheGet(key, maxAgeMs) {
  try {
    const db = await open()
    return await new Promise((resolve) => {
      const q = db.transaction(STORE).objectStore(STORE).get(key)
      q.onsuccess = () => {
        const v = q.result
        resolve(v && Date.now() - v.t < maxAgeMs ? v.data : null)
      }
      q.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

export async function cacheSet(key, data) {
  try {
    const db = await open()
    await new Promise((resolve) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).put({ t: Date.now(), data }, key)
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    })
  } catch {}
}

export async function cacheClear() {
  try {
    const db = await open()
    await new Promise((resolve) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).clear()
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    })
  } catch {}
}
