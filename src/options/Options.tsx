import { useState, useEffect } from 'react'
import { getSettings, saveSettings, type Settings } from '../services/storage'

const PROVIDER_PRESETS: Record<string, { baseUrl: string; defaultModel: string }> = {
  openai: { baseUrl: 'https://api.openai.com/v1', defaultModel: 'gpt-4o-mini' },
  claude: { baseUrl: 'https://api.anthropic.com', defaultModel: 'claude-sonnet-4-20250514' },
  zhipu: { baseUrl: 'https://open.bigmodel.cn/api/paas/v4', defaultModel: 'glm-4-flash' },
  custom: { baseUrl: '', defaultModel: '' },
}

export function Options() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [saved, setSaved] = useState(false)
  const [showKey, setShowKey] = useState(false)

  useEffect(() => {
    getSettings().then(setSettings)
  }, [])

  if (!settings) {
    return <div className="p-8 text-center text-gray-400">加载中...</div>
  }

  const handleProviderChange = (provider: Settings['apiProvider']) => {
    const preset = PROVIDER_PRESETS[provider]
    setSettings({
      ...settings,
      apiProvider: provider,
      apiBaseUrl: preset?.baseUrl ?? '',
      model: preset?.defaultModel ?? '',
    })
  }

  const handleSave = async () => {
    await saveSettings(settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <span className="text-white text-lg font-bold">Q</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">轻问 AI 设置</h1>
            <p className="text-sm text-gray-400">配置你的 AI 服务和偏好</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* AI Provider */}
          <section className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <h2 className="text-sm font-semibold text-gray-800 mb-4">AI 服务配置</h2>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-600">AI 服务商</label>
                <select
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={settings.apiProvider}
                  onChange={(e) => handleProviderChange(e.target.value as Settings['apiProvider'])}
                >
                  <option value="openai">OpenAI (GPT)</option>
                  <option value="claude">Anthropic (Claude)</option>
                  <option value="zhipu">智谱 AI (GLM)</option>
                  <option value="custom">自定义 (OpenAI 兼容)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-600">API Key</label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    className="w-full px-3 py-2 pr-16 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="输入你的 API Key..."
                    value={settings.apiKey}
                    onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                  />
                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-0.5 text-xs text-gray-500 hover:text-gray-700"
                  >
                    {showKey ? '隐藏' : '显示'}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-600">API 地址</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="https://api.openai.com/v1"
                  value={settings.apiBaseUrl}
                  onChange={(e) => setSettings({ ...settings, apiBaseUrl: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-600">模型</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="gpt-4o-mini"
                  value={settings.model}
                  onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                />
              </div>
            </div>
          </section>

          {/* Feature toggles */}
          <section className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <h2 className="text-sm font-semibold text-gray-800 mb-4">功能开关</h2>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-700">选中即用</div>
                  <div className="text-xs text-gray-400">选中网页文字后显示 AI 操作浮窗</div>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, enableSelectAndAct: !settings.enableSelectAndAct })}
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    settings.enableSelectAndAct ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    settings.enableSelectAndAct ? 'translate-x-5' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-700">网页伴读</div>
                  <div className="text-xs text-gray-400">侧边栏自动分析当前网页内容</div>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, enablePageCopilot: !settings.enablePageCopilot })}
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    settings.enablePageCopilot ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    settings.enablePageCopilot ? 'translate-x-5' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            </div>
          </section>

          {/* Shortcuts info */}
          <section className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <h2 className="text-sm font-semibold text-gray-800 mb-4">快捷键</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">打开侧边栏</span>
                <kbd className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded border border-gray-200">Cmd+Shift+L</kbd>
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-400">
              更多快捷键可在 chrome://extensions/shortcuts 中自定义
            </p>
          </section>

          {/* Save button */}
          <button
            onClick={handleSave}
            className="w-full py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
          >
            {saved ? '已保存' : '保存设置'}
          </button>
        </div>
      </div>
    </div>
  )
}
