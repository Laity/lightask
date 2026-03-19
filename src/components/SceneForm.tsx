import { useState, useCallback, useRef } from 'react'
import type { SceneCard } from '../scenes/cards'
import { streamAI } from '../services/ai-router'
import { addHistory } from '../services/storage'

interface SceneFormProps {
  scene: SceneCard
  initialValues?: Record<string, string>
  onBack?: () => void
}

export function SceneForm({ scene, initialValues, onBack }: SceneFormProps) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {}
    for (const field of scene.fields) {
      defaults[field.key] = initialValues?.[field.key] ?? (field.options?.[0]?.value ?? '')
    }
    return defaults
  })

  const [result, setResult] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const handleChange = (key: string, value: string) => {
    setValues(prev => ({ ...prev, [key]: value }))
  }

  const handleGenerate = useCallback(async () => {
    // Validate required fields
    for (const field of scene.fields) {
      if (field.required && !values[field.key]?.trim()) {
        setError(`请填写「${field.label}」`)
        return
      }
    }

    setError(null)
    setResult('')
    setIsGenerating(true)

    abortRef.current = new AbortController()

    await streamAI({
      template: scene.promptTemplate,
      variables: values,
      signal: abortRef.current.signal,
      onChunk: (text) => setResult(text),
      onDone: async (fullText) => {
        setIsGenerating(false)
        await addHistory({
          sceneId: scene.id,
          sceneName: scene.name,
          input: values,
          output: fullText,
          createdAt: Date.now(),
          url: typeof location !== 'undefined' ? location.href : undefined,
        })
      },
      onError: (err) => {
        setIsGenerating(false)
        setError(err.message)
      },
    })
  }, [scene, values])

  const handleStop = () => {
    abortRef.current?.abort()
    setIsGenerating(false)
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleRegenerate = () => {
    handleGenerate()
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 bg-white">
        {onBack && (
          <button onClick={onBack} className="text-gray-500 hover:text-gray-700 text-sm">
            ← 返回
          </button>
        )}
        <span className="text-lg">{scene.icon}</span>
        <h2 className="font-semibold text-gray-900">{scene.name}</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {/* Form fields */}
        {scene.fields.map((field) => (
          <div key={field.key} className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">
              {field.label}
              {field.required && <span className="text-red-400 ml-0.5">*</span>}
            </label>

            {field.type === 'textarea' ? (
              <textarea
                className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none bg-gray-50"
                rows={field.rows ?? 3}
                placeholder={field.placeholder}
                value={values[field.key] ?? ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
              />
            ) : field.type === 'select' ? (
              <select
                className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50"
                value={values[field.key] ?? ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
              >
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50"
                placeholder={field.placeholder}
                value={values[field.key] ?? ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
              />
            )}
          </div>
        ))}

        {/* Generate button */}
        <div className="pt-1">
          {isGenerating ? (
            <button
              onClick={handleStop}
              className="w-full py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
            >
              停止生成
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              className="w-full py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              生成
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="p-2.5 text-xs text-red-600 bg-red-50 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">生成结果</span>
              <div className="flex gap-1.5">
                <button
                  onClick={handleCopy}
                  className="px-2 py-0.5 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors"
                >
                  {copied ? '已复制' : '复制'}
                </button>
                <button
                  onClick={handleRegenerate}
                  disabled={isGenerating}
                  className="px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
                >
                  重新生成
                </button>
              </div>
            </div>
            <div className="p-3 text-sm text-gray-800 bg-white border border-gray-200 rounded-lg whitespace-pre-wrap leading-relaxed">
              {result}
              {isGenerating && <span className="inline-block w-1.5 h-4 ml-0.5 bg-blue-500 animate-pulse" />}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
