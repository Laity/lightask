import { useState, useEffect } from 'react'
import { getHistory, searchHistory, type HistoryRecord } from '../../services/storage'

export function HistoryPanel() {
  const [records, setRecords] = useState<HistoryRecord[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedId, setCopiedId] = useState<number | null>(null)

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    const data = await getHistory()
    setRecords(data)
  }

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    if (query.trim()) {
      const results = await searchHistory(query)
      setRecords(results)
    } else {
      loadHistory()
    }
  }

  const handleCopy = async (record: HistoryRecord) => {
    await navigator.clipboard.writeText(record.output)
    setCopiedId(record.id ?? null)
    setTimeout(() => setCopiedId(null), 1500)
  }

  const formatTime = (ts: number) => {
    const d = new Date(ts)
    const now = new Date()
    const isToday = d.toDateString() === now.toDateString()
    if (isToday) return `今天 ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
    return `${(d.getMonth() + 1)}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <input
          type="text"
          className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50"
          placeholder="搜索历史记录..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
        />
        <svg className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Records */}
      {records.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          暂无历史记录
        </div>
      ) : (
        <div className="space-y-2">
          {records.map((record) => (
            <div key={record.id} className="p-3 bg-white border border-gray-200 rounded-lg space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-gray-700">{record.sceneName}</span>
                </div>
                <span className="text-xs text-gray-400">{formatTime(record.createdAt)}</span>
              </div>
              <p className="text-xs text-gray-600 line-clamp-3">{record.output}</p>
              <button
                onClick={() => handleCopy(record)}
                className="text-xs text-blue-500 hover:text-blue-700"
              >
                {copiedId === record.id ? '已复制' : '复制结果'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
