import { useState } from 'react'
import { SCENE_CARDS, type SceneCard } from '../scenes/cards'
import { SceneGrid } from '../components/SceneGrid'
import { SceneForm } from '../components/SceneForm'
import { AccidentForm } from '../components/AccidentForm'
import { PageCopilot } from './copilot/PageCopilot'
import { HistoryPanel } from './history/HistoryPanel'

type Tab = 'copilot' | 'scenes' | 'history'

export function SidePanel() {
  const [activeTab, setActiveTab] = useState<Tab>('copilot')
  const [activeScene, setActiveScene] = useState<SceneCard | null>(null)

  const tabs: Array<{ id: Tab; label: string; icon: string }> = [
    { id: 'copilot', label: '伴读', icon: '📖' },
    { id: 'scenes', label: '场景', icon: '⚡' },
    { id: 'history', label: '历史', icon: '🕐' },
  ]

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="px-4 pt-3 pb-2 bg-white border-b border-gray-200">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-400 rounded-md flex items-center justify-center shadow-sm">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
              <path d="M5 6h14a2 2 0 012 2v7a2 2 0 01-2 2h-6.5l-3.5 3v-3H5a2 2 0 01-2-2V8a2 2 0 012-2z" fill="rgba(255,255,255,0.95)"/>
              <circle cx="9" cy="11.5" r="1.2" fill="#8b5cf6" opacity="0.4"/>
              <circle cx="12" cy="11.5" r="1.2" fill="#8b5cf6" opacity="0.65"/>
              <circle cx="15" cy="11.5" r="1.2" fill="#8b5cf6" opacity="0.9"/>
            </svg>
          </div>
          <span className="text-sm font-bold text-gray-900">轻问 AI</span>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setActiveScene(null) }}
              className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'copilot' && (
          <div className="p-4">
            <PageCopilot />
          </div>
        )}

        {activeTab === 'scenes' && (
          <div className="p-4">
            {activeScene ? (
              activeScene.customForm ? (
                <AccidentForm scene={activeScene} onBack={() => setActiveScene(null)} />
              ) : (
                <SceneForm scene={activeScene} onBack={() => setActiveScene(null)} />
              )
            ) : (
              <SceneGrid scenes={SCENE_CARDS} onSelect={setActiveScene} />
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="p-4">
            <HistoryPanel />
          </div>
        )}
      </div>
    </div>
  )
}
