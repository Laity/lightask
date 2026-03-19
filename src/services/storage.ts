// Storage service: Chrome Storage API wrapper for settings, IndexedDB via Dexie for history
import Dexie, { type EntityTable } from 'dexie'

// ========== Types ==========

export interface Settings {
  apiProvider: 'openai' | 'claude' | 'zhipu' | 'custom'
  apiKey: string
  apiBaseUrl: string
  model: string
  enableSelectAndAct: boolean
  enablePageCopilot: boolean
  language: 'zh' | 'en'
}

export interface HistoryRecord {
  id?: number
  sceneId: string
  sceneName: string
  input: Record<string, string>
  output: string
  createdAt: number
  url?: string
  pageTitle?: string
}

// ========== Defaults ==========

const DEFAULT_SETTINGS: Settings = {
  apiProvider: 'openai',
  apiKey: '',
  apiBaseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4o-mini',
  enableSelectAndAct: true,
  enablePageCopilot: true,
  language: 'zh',
}

// ========== Chrome Storage (Settings) ==========

export async function getSettings(): Promise<Settings> {
  const result = await chrome.storage.sync.get('settings')
  return { ...DEFAULT_SETTINGS, ...(result.settings as Partial<Settings> | undefined) }
}

export async function saveSettings(settings: Partial<Settings>): Promise<void> {
  const current = await getSettings()
  await chrome.storage.sync.set({ settings: { ...current, ...settings } })
}

// ========== IndexedDB (History) ==========

class LightAskDB extends Dexie {
  history!: EntityTable<HistoryRecord, 'id'>

  constructor() {
    super('lightask')
    this.version(1).stores({
      history: '++id, sceneId, createdAt, sceneName',
    })
  }
}

const db = new LightAskDB()

export async function addHistory(record: Omit<HistoryRecord, 'id'>): Promise<number> {
  const id = await db.history.add(record as HistoryRecord)

  // Keep only last 50 records
  const count = await db.history.count()
  if (count > 50) {
    const oldest = await db.history.orderBy('createdAt').limit(count - 50).toArray()
    await db.history.bulkDelete(oldest.map(r => r.id!))
  }

  return id as number
}

export async function getHistory(limit = 50): Promise<HistoryRecord[]> {
  return db.history.orderBy('createdAt').reverse().limit(limit).toArray()
}

export async function searchHistory(query: string): Promise<HistoryRecord[]> {
  const all = await db.history.orderBy('createdAt').reverse().toArray()
  const q = query.toLowerCase()
  return all.filter(r =>
    r.sceneName.toLowerCase().includes(q) ||
    r.output.toLowerCase().includes(q) ||
    Object.values(r.input).some(v => v.toLowerCase().includes(q))
  )
}

export async function clearHistory(): Promise<void> {
  await db.history.clear()
}
