import { useState } from 'react'
import { SCENE_CARDS, type SceneCard } from '../scenes/cards'
import { SceneGrid } from '../components/SceneGrid'
import { SceneForm } from '../components/SceneForm'
import { AccidentForm } from '../components/AccidentForm'

export function Popup() {
  const [activeScene, setActiveScene] = useState<SceneCard | null>(null)

  if (activeScene) {
    return (
      <div className="w-[360px] h-[520px] flex flex-col bg-white">
        {activeScene.customForm ? (
          <AccidentForm scene={activeScene} onBack={() => setActiveScene(null)} />
        ) : (
          <SceneForm scene={activeScene} onBack={() => setActiveScene(null)} />
        )}
      </div>
    )
  }

  return (
    <div className="w-[360px] h-[520px] flex flex-col bg-white">
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">Q</span>
            </div>
            <h1 className="text-base font-bold text-gray-900">轻问 AI</h1>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => chrome.sidePanel?.open({ windowId: chrome.windows?.WINDOW_ID_CURRENT })}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="打开侧边栏"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            </button>
            <button
              onClick={() => chrome.runtime.openOptionsPage()}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="设置"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-400 mb-3">不会提问？轻轻一点，AI 就懂你</p>
      </div>

      {/* Scene cards */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <SceneGrid scenes={SCENE_CARDS} onSelect={setActiveScene} />
      </div>
    </div>
  )
}
