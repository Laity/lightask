import { useState, useCallback, useRef } from 'react'
import type { SceneCard } from '../scenes/cards'
import { streamAI, type ImageData } from '../services/ai-router'
import { addHistory } from '../services/storage'
import { getLocationFromImage, fileToBase64, type LocationInfo } from '../services/exif-parser'

interface AccidentFormProps {
  scene: SceneCard
  onBack?: () => void
}

interface PhotoItem {
  file: File
  preview: string       // data URL for preview
  base64: string        // raw base64 (no prefix)
  mediaType: string
  location: LocationInfo | null
}

export function AccidentForm({ scene, onBack }: AccidentFormProps) {
  const [photos, setPhotos] = useState<PhotoItem[]>([])
  const [city, setCity] = useState('')
  const [accidentDesc, setAccidentDesc] = useState('')
  const [partyCount, setPartyCount] = useState('2')
  const [extra, setExtra] = useState('')

  const [isUploading, setIsUploading] = useState(false)
  const [locationStatus, setLocationStatus] = useState<string>('')

  const [result, setResult] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageFallback, setImageFallback] = useState(false)
  const [copied, setCopied] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setIsUploading(true)
    setLocationStatus('正在解析照片信息...')
    setError(null)

    const newPhotos: PhotoItem[] = []

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue

      const dataUrl = await fileToBase64(file)
      // Extract raw base64 from data URL (remove "data:image/jpeg;base64," prefix)
      const base64 = dataUrl.split(',')[1] || ''
      const mediaType = file.type || 'image/jpeg'

      // Try to extract GPS location
      let location: LocationInfo | null = null
      try {
        location = await getLocationFromImage(file)
      } catch {
        // GPS extraction failed, continue without location
      }

      newPhotos.push({ file, preview: dataUrl, base64, mediaType, location })
    }

    setPhotos(prev => {
      const updated = [...prev, ...newPhotos]

      // Auto-fill city from the first photo with location data
      if (!city) {
        const locPhoto = updated.find(p => p.location?.city)
        if (locPhoto?.location) {
          const cityName = [locPhoto.location.city, locPhoto.location.province]
            .filter(Boolean)
            .join(', ')
          setCity(cityName)
          setLocationStatus(`已识别位置: ${locPhoto.location.displayName}`)
        } else {
          const coordPhoto = updated.find(p => p.location?.coordinates)
          if (coordPhoto?.location) {
            setLocationStatus(`已获取坐标: ${coordPhoto.location.displayName}，请手动确认城市`)
          } else {
            setLocationStatus('未检测到照片位置信息，请手动输入城市')
          }
        }
      }

      return updated
    })

    setIsUploading(false)
  }, [city])

  const handleRemovePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index))
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    handleFileSelect(e.dataTransfer.files)
  }, [handleFileSelect])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleGenerate = useCallback(async () => {
    if (photos.length === 0) {
      setError('请上传至少一张事故现场照片')
      return
    }
    if (!accidentDesc.trim()) {
      setError('请填写事故描述')
      return
    }

    setError(null)
    setResult('')
    setIsGenerating(true)
    setImageFallback(false)

    abortRef.current = new AbortController()

    const variables: Record<string, string> = {
      city: city || '未知（请根据照片内容推断）',
      accidentDesc,
      partyCount,
      extra,
    }

    const images: ImageData[] = photos.map(p => ({
      base64: p.base64,
      mediaType: p.mediaType,
    }))

    await streamAI({
      template: scene.promptTemplate,
      variables,
      images,
      signal: abortRef.current.signal,
      onChunk: (text) => setResult(text),
      onImageFallback: () => setImageFallback(true),
      onDone: async (fullText) => {
        setIsGenerating(false)
        await addHistory({
          sceneId: scene.id,
          sceneName: scene.name,
          input: { ...variables, photoCount: String(photos.length) },
          output: fullText,
          createdAt: Date.now(),
          url: typeof location !== 'undefined' ? window.location.href : undefined,
        })
      },
      onError: (err) => {
        setIsGenerating(false)
        setError(err.message)
      },
    })
  }, [scene, photos, city, accidentDesc, partyCount, extra])

  const handleStop = () => {
    abortRef.current?.abort()
    setIsGenerating(false)
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 bg-white">
        {onBack && (
          <button onClick={onBack} className="text-gray-500 hover:text-gray-700 text-sm">
            &larr; 返回
          </button>
        )}
        <span className="text-lg">{scene.icon}</span>
        <h2 className="font-semibold text-gray-900">{scene.name}</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {/* Photo Upload Area */}
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-600">
            事故现场照片 <span className="text-red-400 ml-0.5">*</span>
          </label>

          {/* Upload Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files)}
            />
            <div className="text-2xl mb-1">📷</div>
            <p className="text-sm text-gray-500">
              {isUploading ? '正在处理...' : '点击或拖拽上传事故照片'}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">支持多张照片，系统将自动提取位置信息</p>
          </div>

          {/* Photo Previews */}
          {photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-2">
              {photos.map((photo, idx) => (
                <div key={idx} className="relative group">
                  <img
                    src={photo.preview}
                    alt={`事故照片 ${idx + 1}`}
                    className="w-full h-20 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRemovePhoto(idx) }}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    &times;
                  </button>
                  {photo.location && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-1 py-0.5 rounded-b-lg truncate">
                      📍 {photo.location.city || photo.location.displayName}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Location Status */}
          {locationStatus && (
            <p className={`text-xs mt-1 ${city ? 'text-green-600' : 'text-amber-600'}`}>
              {locationStatus}
            </p>
          )}
        </div>

        {/* City Input */}
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-600">
            事故城市
            {city && <span className="text-green-500 ml-1 text-[10px]">(已识别)</span>}
          </label>
          <input
            type="text"
            className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50"
            placeholder="自动识别或手动输入城市名..."
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </div>

        {/* Accident Description */}
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-600">
            事故描述 <span className="text-red-400 ml-0.5">*</span>
          </label>
          <textarea
            className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none bg-gray-50"
            rows={4}
            placeholder="描述事故经过：时间、地点、车辆行驶方向、碰撞位置等..."
            value={accidentDesc}
            onChange={(e) => setAccidentDesc(e.target.value)}
          />
        </div>

        {/* Party Count */}
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-600">
            涉事方数量 <span className="text-red-400 ml-0.5">*</span>
          </label>
          <select
            className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50"
            value={partyCount}
            onChange={(e) => setPartyCount(e.target.value)}
          >
            <option value="2">双方事故</option>
            <option value="3">三方事故</option>
            <option value="4+">多方事故（4方以上）</option>
          </select>
        </div>

        {/* Extra Info */}
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-600">补充信息</label>
          <textarea
            className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none bg-gray-50"
            rows={3}
            placeholder="（选填）其他相关信息，如天气状况、路面情况、是否有交通信号灯等..."
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
          />
        </div>

        {/* Generate / Stop Button */}
        <div className="pt-1">
          {isGenerating ? (
            <button
              onClick={handleStop}
              className="w-full py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
            >
              停止分析
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              className="w-full py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              开始分析
            </button>
          )}
        </div>

        {/* Image Fallback Warning */}
        {imageFallback && (
          <div className="p-2.5 text-xs text-amber-700 bg-amber-50 rounded-lg border border-amber-200">
            当前模型不支持图片分析，已自动切换为纯文字模式。建议在设置中切换为支持视觉的模型（如 GPT-4o、Claude Sonnet、GLM-4V 等）以获得更准确的分析。
          </div>
        )}

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
              <span className="text-xs font-medium text-gray-500">分析结果</span>
              <div className="flex gap-1.5">
                <button
                  onClick={handleCopy}
                  className="px-2 py-0.5 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors"
                >
                  {copied ? '已复制' : '复制'}
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
                >
                  重新分析
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
