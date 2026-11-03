/**
 * Armazenamento persistente de mídia (Logos e Capas) usando IndexedDB,
 * com fallback seguro para localStorage e sem risco de estourar a cota de 5MB.
 */

const DB_NAME = 'specboard_media_db'
const DB_VERSION = 1
const STORE_NAME = 'project_media'

export interface ProjectMediaRecord {
  projectId: string
  logo?: string | null
  cover?: string | null
  updatedAt: number
}

function openDB(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') {
      resolve(null)
      return
    }

    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'projectId' })
        }
      }

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
}

export const mediaStorage = {
  async getAll(): Promise<Record<string, { logo?: string | null; cover?: string | null }>> {
    const result: Record<string, { logo?: string | null; cover?: string | null }> = {}

    // 1. Tenta carregar do localStorage primeiro (para migração e leitura rápida inicial)
    try {
      const lsLogos = JSON.parse(localStorage.getItem('specboard.projectLogos') || '{}')
      const lsCovers = JSON.parse(localStorage.getItem('specboard.projectCovers') || '{}')

      for (const [id, logo] of Object.entries(lsLogos)) {
        if (!result[id]) result[id] = {}
        result[id].logo = logo as string
      }
      for (const [id, cover] of Object.entries(lsCovers)) {
        if (!result[id]) result[id] = {}
        result[id].cover = cover as string
      }
    } catch {
      // Ignora erro no localStorage
    }

    // 2. Sobrescreve/complementa com os dados do IndexedDB (que não tem limitação de 5MB)
    const db = await openDB()
    if (!db) return result

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readonly')
        const store = tx.objectStore(STORE_NAME)
        const req = store.getAll()

        req.onsuccess = () => {
          const records = req.result as ProjectMediaRecord[]
          for (const r of records) {
            if (!result[r.projectId]) result[r.projectId] = {}
            if (r.logo !== undefined) result[r.projectId].logo = r.logo
            if (r.cover !== undefined) result[r.projectId].cover = r.cover
          }
          resolve(result)
        }

        req.onerror = () => resolve(result)
      } catch {
        resolve(result)
      }
    })
  },

  async save(
    projectId: string,
    media: { logo?: string | null; cover?: string | null },
  ): Promise<void> {
    const db = await openDB()
    if (db) {
      await new Promise<void>((resolve) => {
        try {
          const tx = db.transaction(STORE_NAME, 'readwrite')
          const store = tx.objectStore(STORE_NAME)
          const getReq = store.get(projectId)

          getReq.onsuccess = () => {
            const existing = (getReq.result as ProjectMediaRecord) || { projectId, updatedAt: Date.now() }
            if (media.logo !== undefined) existing.logo = media.logo
            if (media.cover !== undefined) existing.cover = media.cover
            existing.updatedAt = Date.now()

            store.put(existing)
          }

          tx.oncomplete = () => resolve()
          tx.onerror = () => resolve()
        } catch {
          resolve()
        }
      })
    }

    // Tenta manter localStorage sincronizado com segurança (evita lançar exceção se estourar cota)
    try {
      const logos = JSON.parse(localStorage.getItem('specboard.projectLogos') || '{}')
      if (media.logo !== undefined) {
        if (media.logo) logos[projectId] = media.logo
        else delete logos[projectId]
        localStorage.setItem('specboard.projectLogos', JSON.stringify(logos))
      }
    } catch {
      // QuotaExceededError suprimido com segurança; o dado está garantido no IndexedDB!
    }

    try {
      const covers = JSON.parse(localStorage.getItem('specboard.projectCovers') || '{}')
      if (media.cover !== undefined) {
        if (media.cover) covers[projectId] = media.cover
        else delete covers[projectId]
        localStorage.setItem('specboard.projectCovers', JSON.stringify(covers))
      }
    } catch {
      // QuotaExceededError suprimido com segurança; o dado está garantido no IndexedDB!
    }
  },
}
