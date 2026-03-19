// AI Router: unified API for calling different AI providers with SSE streaming
import { getSettings, type Settings } from './storage'
import { renderPrompt, type PromptTemplate } from './prompt-engine'

export interface ImageData {
  base64: string      // raw base64 (without data URL prefix)
  mediaType: string   // e.g. "image/jpeg", "image/png"
}

export interface AIRequestOptions {
  template: PromptTemplate
  variables: Record<string, string>
  images?: ImageData[]
  onChunk: (text: string) => void
  onDone: (fullText: string) => void
  onError: (error: Error) => void
  onImageFallback?: () => void  // called when images are dropped due to model not supporting them
  signal?: AbortSignal
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MessageList = Array<{ role: string; content: any }>

interface ProviderConfig {
  url: string
  headers: Record<string, string>
  buildBody: (messages: MessageList, model: string) => string
}

function getProviderConfig(settings: Settings): ProviderConfig {
  const { apiProvider, apiKey, apiBaseUrl, model } = settings

  const openaiCompatible: ProviderConfig = {
    url: `${apiBaseUrl}/chat/completions`,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    buildBody: (messages, m) => JSON.stringify({
      model: m || model,
      messages,
      stream: true,
    }),
  }

  switch (apiProvider) {
    case 'claude':
      return {
        url: `${apiBaseUrl || 'https://api.anthropic.com'}/v1/messages`,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        buildBody: (messages, m) => {
          const system = messages.find(msg => msg.role === 'system')?.content ?? ''
          const userMessages = messages.filter(msg => msg.role !== 'system')
          return JSON.stringify({
            model: m || model || 'claude-sonnet-4-20250514',
            max_tokens: 4096,
            system,
            messages: userMessages,
            stream: true,
          })
        },
      }

    case 'zhipu':
      return {
        ...openaiCompatible,
        url: `${apiBaseUrl || 'https://open.bigmodel.cn'}/api/paas/v4/chat/completions`,
      }

    case 'openai':
    case 'custom':
    default:
      return openaiCompatible
  }
}

function parseSSELine(line: string, provider: string): string | null {
  if (!line.startsWith('data: ')) return null
  const data = line.slice(6).trim()
  if (data === '[DONE]') return null

  try {
    const json = JSON.parse(data)

    if (provider === 'claude') {
      if (json.type === 'content_block_delta') {
        return json.delta?.text ?? null
      }
      return null
    }

    // OpenAI compatible
    return json.choices?.[0]?.delta?.content ?? null
  } catch {
    return null
  }
}

function isImageNotSupportedError(status: number, body: string): boolean {
  if (status !== 400) return false
  const lower = body.toLowerCase()
  return lower.includes('image') && (
    lower.includes('not support') ||
    lower.includes('do not support') ||
    lower.includes('does not support') ||
    lower.includes('unsupported') ||
    lower.includes('invalidparameter')
  )
}

function buildMessages(
  rendered: { system: string; user: string },
  images: ImageData[] | undefined,
  provider: string,
): MessageList {
  const messages: MessageList = [
    { role: 'system', content: rendered.system },
  ]

  if (images && images.length > 0) {
    if (provider === 'claude') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const contentParts: any[] = images.map(img => ({
        type: 'image',
        source: { type: 'base64', media_type: img.mediaType, data: img.base64 },
      }))
      contentParts.push({ type: 'text', text: rendered.user })
      messages.push({ role: 'user', content: contentParts })
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const contentParts: any[] = images.map(img => ({
        type: 'image_url',
        image_url: { url: `data:${img.mediaType};base64,${img.base64}` },
      }))
      contentParts.push({ type: 'text', text: rendered.user })
      messages.push({ role: 'user', content: contentParts })
    }
  } else {
    messages.push({ role: 'user', content: rendered.user })
  }

  return messages
}

export async function streamAI(options: AIRequestOptions): Promise<void> {
  const { template, variables, images, onChunk, onDone, onError, onImageFallback, signal } = options

  const settings = await getSettings()

  if (!settings.apiKey) {
    onError(new Error('请先在设置中配置 API Key'))
    return
  }

  const rendered = renderPrompt(template, variables)
  const config = getProviderConfig(settings)

  try {
    // Build messages - support multimodal when images are provided
    let messages = buildMessages(rendered, images, settings.apiProvider)

    let response = await fetch(config.url, {
      method: 'POST',
      headers: config.headers,
      body: config.buildBody(messages, settings.model),
      signal,
    })

    // If model doesn't support images, automatically fallback to text-only
    if (!response.ok && images && images.length > 0) {
      const errorText = await response.text()
      if (isImageNotSupportedError(response.status, errorText)) {
        onImageFallback?.()
        const fallbackRendered = {
          system: rendered.system,
          user: `（注意：当前模型不支持图片分析，以下分析仅基于用户的文字描述。用户已上传 ${images.length} 张事故现场照片但无法解析，请根据文字描述尽可能给出分析）\n\n${rendered.user}`,
        }
        messages = buildMessages(fallbackRendered, undefined, settings.apiProvider)
        response = await fetch(config.url, {
          method: 'POST',
          headers: config.headers,
          body: config.buildBody(messages, settings.model),
          signal,
        })
      } else {
        throw new Error(`API 请求失败 (${response.status}): ${errorText}`)
      }
    }

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API 请求失败 (${response.status}): ${errorText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('无法读取响应流')

    const decoder = new TextDecoder()
    let fullText = ''
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        const text = parseSSELine(line, settings.apiProvider)
        if (text) {
          fullText += text
          onChunk(fullText)
        }
      }
    }

    // Process remaining buffer
    if (buffer.trim()) {
      const text = parseSSELine(buffer, settings.apiProvider)
      if (text) {
        fullText += text
        onChunk(fullText)
      }
    }

    onDone(fullText)
  } catch (err) {
    if ((err as Error).name === 'AbortError') return
    onError(err instanceof Error ? err : new Error(String(err)))
  }
}
