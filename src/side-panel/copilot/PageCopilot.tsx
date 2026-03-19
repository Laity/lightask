import { useState, useEffect, useCallback } from 'react'
import { streamAI } from '../../services/ai-router'

interface PageAnalysis {
  summary: string
  keyPoints: string[]
  suggestedQuestions: string[]
}

export function PageCopilot() {
  const [pageContent, setPageContent] = useState('')
  const [pageTitle, setPageTitle] = useState('')
  const [analysis, setAnalysis] = useState<PageAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [followUpResult, setFollowUpResult] = useState('')
  const [isFollowingUp, setIsFollowingUp] = useState(false)

  const extractPageContent = useCallback(async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (!tab?.id) return

      setPageTitle(tab.title ?? '')

      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          // Try to extract main content
          const article = document.querySelector('article') ?? document.querySelector('main') ?? document.body
          const text = article.innerText?.slice(0, 8000) ?? ''
          return text
        },
      })

      const text = results?.[0]?.result as string
      if (text?.trim()) {
        setPageContent(text)
      }
    } catch {
      setError('无法提取当前页面内容')
    }
  }, [])

  const analyzePage = useCallback(async () => {
    if (!pageContent.trim()) return

    setIsAnalyzing(true)
    setError(null)
    setAnalysis(null)

    await streamAI({
      template: {
        system: '你是一个网页内容分析助手。请分析用户提供的网页内容，按以下JSON格式返回结果（不要包含任何其他文字，只返回JSON）：\n{"summary":"一句话摘要","keyPoints":["要点1","要点2","要点3"],"suggestedQuestions":["你可能想问的问题1","你可能想问的问题2","你可能想问的问题3"]}',
        user: '网页标题：{{title}}\n\n网页内容：\n{{content}}',
      },
      variables: { title: pageTitle, content: pageContent.slice(0, 6000) },
      onChunk: () => {},
      onDone: (fullText) => {
        setIsAnalyzing(false)
        try {
          // Extract JSON from the response (handle possible markdown code blocks)
          const jsonMatch = fullText.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]) as PageAnalysis
            setAnalysis(parsed)
          } else {
            setError('分析结果解析失败')
          }
        } catch {
          setError('分析结果解析失败')
        }
      },
      onError: (err) => {
        setIsAnalyzing(false)
        setError(err.message)
      },
    })
  }, [pageContent, pageTitle])

  useEffect(() => {
    extractPageContent()
  }, [extractPageContent])

  useEffect(() => {
    if (pageContent) analyzePage()
  }, [pageContent, analyzePage])

  const handleFollowUp = async (question: string) => {
    setFollowUpResult('')
    setIsFollowingUp(true)

    await streamAI({
      template: {
        system: '你是一个网页内容问答助手。请根据网页内容回答用户的问题。回答要简洁准确。',
        user: '网页标题：{{title}}\n\n网页内容摘要：{{summary}}\n\n用户问题：{{question}}',
      },
      variables: {
        title: pageTitle,
        summary: pageContent.slice(0, 4000),
        question,
      },
      onChunk: (text) => setFollowUpResult(text),
      onDone: () => setIsFollowingUp(false),
      onError: (err) => {
        setIsFollowingUp(false)
        setFollowUpResult(`错误：${err.message}`)
      },
    })
  }

  return (
    <div className="space-y-4">
      {/* Page title */}
      {pageTitle && (
        <div className="text-xs text-gray-400 truncate px-1">
          当前页面：{pageTitle}
        </div>
      )}

      {/* Loading */}
      {isAnalyzing && (
        <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-xl">
          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-blue-600">正在分析页面内容...</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-3 text-xs text-red-600 bg-red-50 rounded-lg border border-red-200">
          {error}
          <button onClick={analyzePage} className="ml-2 underline">重试</button>
        </div>
      )}

      {/* Analysis result */}
      {analysis && (
        <>
          {/* Summary */}
          <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
            <div className="text-xs font-medium text-blue-500 mb-1">一句话摘要</div>
            <p className="text-sm text-gray-800 leading-relaxed">{analysis.summary}</p>
          </div>

          {/* Key points */}
          <div className="space-y-1.5">
            <div className="text-xs font-medium text-gray-500 px-1">关键要点</div>
            {analysis.keyPoints.map((point, i) => (
              <div key={i} className="flex items-start gap-2 p-2.5 bg-gray-50 rounded-lg">
                <span className="text-xs text-blue-500 font-bold mt-0.5">{i + 1}</span>
                <span className="text-sm text-gray-700 leading-relaxed">{point}</span>
              </div>
            ))}
          </div>

          {/* Suggested questions */}
          <div className="space-y-1.5">
            <div className="text-xs font-medium text-gray-500 px-1">你可能想问</div>
            {analysis.suggestedQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => handleFollowUp(q)}
                disabled={isFollowingUp}
                className="w-full text-left px-3 py-2 text-sm text-blue-600 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Follow-up result */}
      {followUpResult && (
        <div className="p-3 text-sm text-gray-800 bg-white border border-gray-200 rounded-xl whitespace-pre-wrap leading-relaxed">
          {followUpResult}
          {isFollowingUp && <span className="inline-block w-1.5 h-4 ml-0.5 bg-blue-500 animate-pulse" />}
        </div>
      )}

      {/* Empty state */}
      {!isAnalyzing && !analysis && !error && (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm">打开网页后自动分析</p>
        </div>
      )}
    </div>
  )
}
