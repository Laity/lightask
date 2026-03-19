// Content Script: Select & Act - floating toolbar on text selection
// Pure vanilla DOM, no React - avoids CRXJS dynamic import + React-in-Shadow-DOM issues

// ========== Content Type Detection ==========

type ContentType = 'english' | 'chinese' | 'code' | 'email' | 'general'

function detectContentType(text: string): ContentType {
  const t = text.trim()
  if (/[{}<>\/\\;]/.test(t) && (/function|const|let|var|class|import|def |return /.test(t) || /[=]{2,}|[!]=/.test(t))) return 'code'
  if (/(From:|To:|Subject:|发件人|收件人|主题)/.test(t) || /Dear |Hi |Hello |你好|尊敬的/.test(t)) return 'email'
  const cn = (t.match(/[\u4e00-\u9fff]/g) ?? []).length
  const total = t.length
  if (total > 0 && cn / total < 0.1) return 'english'
  if (cn / total > 0.3) return 'chinese'
  return 'general'
}

interface QuickAction {
  id: string
  label: string
  icon: string
  prompt: { system: string; user: string }
}

function getActions(ct: ContentType): QuickAction[] {
  const T: QuickAction = { id: 'translate', label: '翻译', icon: '🌐', prompt: { system: '你是一个翻译助手。如果原文是中文，翻译成英文；如果是其他语言，翻译成中文。只输出译文。', user: '请翻译：\n\n{{text}}' } }
  const S: QuickAction = { id: 'summarize', label: '摘要', icon: '📝', prompt: { system: '你是一个摘要助手。用简洁语言总结要点，不超过100字。只输出摘要。', user: '请总结：\n\n{{text}}' } }
  const E: QuickAction = { id: 'explain', label: '解释', icon: '💡', prompt: { system: '你是一个知识讲解助手。用通俗易懂的语言解释内容。如果是代码，解释其功能和逻辑。', user: '请解释：\n\n{{text}}' } }
  const P: QuickAction = { id: 'polish', label: '润色', icon: '✨', prompt: { system: '你是一个文案润色助手。优化表达，使之更流畅专业。保持原意不变。只输出润色后的文本。', user: '请润色：\n\n{{text}}' } }
  switch (ct) {
    case 'english': return [T, S, E, P]
    case 'code': return [E, T, S, P]
    case 'email': return [T, S, P, E]
    case 'chinese': return [S, P, T, E]
    default: return [T, S, E, P]
  }
}

// ========== Toolbar Controller ==========

class SelectAndActToolbar {
  private host: HTMLDivElement
  private shadow: ShadowRoot
  private wrapper: HTMLDivElement
  private toolbar: HTMLDivElement | null = null
  private resultPanel: HTMLDivElement | null = null
  private selectedText = ''
  private isLoading = false
  private isVisible = false

  constructor() {
    // Create shadow host
    this.host = document.createElement('div')
    this.host.id = 'lightask-select-act'
    this.shadow = this.host.attachShadow({ mode: 'closed' })

    // Inject styles
    const style = document.createElement('style')
    style.textContent = this.getStyles()
    this.shadow.appendChild(style)

    // Wrapper for content
    this.wrapper = document.createElement('div')
    this.wrapper.className = 'la-wrapper'
    this.shadow.appendChild(this.wrapper)

    document.documentElement.appendChild(this.host)
    this.bindEvents()
  }

  private getStyles(): string {
    return `
      :host {
        all: initial;
        position: fixed;
        top: 0; left: 0;
        width: 0; height: 0;
        overflow: visible;
        z-index: 2147483647;
        pointer-events: none;
      }
      .la-wrapper {
        pointer-events: auto;
      }
      .la-toolbar {
        position: fixed;
        display: flex;
        gap: 2px;
        padding: 4px;
        background: #fff;
        border-radius: 12px;
        box-shadow: 0 4px 24px rgba(0,0,0,0.16), 0 0 0 1px rgba(0,0,0,0.05);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
        animation: la-fadein 0.15s ease-out;
      }
      .la-btn {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 7px 12px;
        font-size: 13px;
        font-weight: 500;
        color: #4b5563;
        background: transparent;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        white-space: nowrap;
        transition: background 0.12s;
        line-height: 1;
        font-family: inherit;
      }
      .la-btn:hover { background: #f3f4f6; }
      .la-btn.primary { color: #2563eb; background: #eff6ff; }
      .la-btn.primary:hover { background: #dbeafe; }
      .la-btn:disabled { opacity: 0.5; cursor: wait; }
      .la-btn-icon { font-size: 14px; }
      .la-result {
        position: fixed;
        min-width: 280px;
        max-width: 420px;
        max-height: 340px;
        overflow-y: auto;
        padding: 14px;
        background: #fff;
        border-radius: 12px;
        box-shadow: 0 4px 24px rgba(0,0,0,0.16), 0 0 0 1px rgba(0,0,0,0.05);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
        animation: la-fadein 0.15s ease-out;
      }
      .la-result-text {
        font-size: 13px;
        line-height: 1.7;
        color: #1f2937;
        white-space: pre-wrap;
        word-break: break-word;
      }
      .la-result-text .la-cursor {
        display: inline-block;
        width: 6px; height: 15px;
        margin-left: 2px;
        background: #3b82f6;
        vertical-align: text-bottom;
        animation: la-blink 0.8s step-end infinite;
      }
      .la-result-actions {
        display: flex;
        justify-content: flex-end;
        gap: 6px;
        margin-top: 10px;
      }
      .la-small-btn {
        padding: 4px 10px;
        font-size: 12px;
        font-weight: 500;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-family: inherit;
        transition: opacity 0.12s;
      }
      .la-small-btn:hover { opacity: 0.85; }
      .la-small-btn.copy { color: #2563eb; background: #eff6ff; }
      .la-small-btn.close { color: #6b7280; background: #f3f4f6; }
      .la-error { font-size: 13px; color: #dc2626; line-height: 1.5; }
      .la-loading { font-size: 13px; color: #6b7280; }
      @keyframes la-fadein { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes la-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
    `
  }

  private bindEvents() {
    let mouseDownInToolbar = false

    // Track mousedown on our shadow to prevent selection clearing
    this.shadow.addEventListener('mousedown', (e) => {
      mouseDownInToolbar = true
      e.preventDefault() // Prevent losing text selection
    })

    document.addEventListener('mouseup', (e) => {
      // If mouseup is after clicking inside our toolbar, ignore
      if (mouseDownInToolbar) {
        mouseDownInToolbar = false
        return
      }

      // Check if mouseup target is inside our host
      const path = e.composedPath()
      if (path.includes(this.host)) return

      setTimeout(() => this.onSelectionChange(), 20)
    }, true)

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.hide()
    }, true)

    // Hide when scrolling (optional, improves UX)
    let scrollTimer: ReturnType<typeof setTimeout>
    document.addEventListener('scroll', () => {
      if (!this.isVisible) return
      clearTimeout(scrollTimer)
      scrollTimer = setTimeout(() => {
        if (!this.isLoading) this.hide()
      }, 150)
    }, true)
  }

  private onSelectionChange() {
    const sel = window.getSelection()
    const text = sel?.toString().trim() ?? ''

    if (text.length < 2) {
      if (!this.isLoading) this.hide()
      return
    }

    try {
      const range = sel?.getRangeAt(0)
      if (!range) return
      const rect = range.getBoundingClientRect()
      if (rect.width === 0 && rect.height === 0) return

      this.selectedText = text
      const ct = detectContentType(text)
      const actions = getActions(ct)

      this.showToolbar(rect, actions)
    } catch {
      // getRangeAt can throw if selection is invalid
    }
  }

  private showToolbar(rect: DOMRect, actions: QuickAction[]) {
    this.hide()

    this.toolbar = document.createElement('div')
    this.toolbar.className = 'la-toolbar'

    // Position: above the selection, centered
    const x = Math.min(Math.max(rect.left + rect.width / 2, 140), window.innerWidth - 140)
    const y = rect.top - 10
    this.toolbar.style.left = `${x}px`
    this.toolbar.style.top = `${y}px`
    this.toolbar.style.transform = 'translate(-50%, -100%)'

    actions.forEach((action, i) => {
      const btn = document.createElement('button')
      btn.className = i === 0 ? 'la-btn primary' : 'la-btn'
      btn.innerHTML = `<span class="la-btn-icon">${action.icon}</span><span>${action.label}</span>`
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        this.executeAction(action, rect)
      })
      this.toolbar!.appendChild(btn)
    })

    this.wrapper.appendChild(this.toolbar)
    this.isVisible = true
  }

  private executeAction(action: QuickAction, selRect: DOMRect) {
    // Remove toolbar
    if (this.toolbar) {
      this.toolbar.remove()
      this.toolbar = null
    }

    // Create result panel
    this.resultPanel = document.createElement('div')
    this.resultPanel.className = 'la-result'

    // Position result panel below the selection
    const x = Math.min(Math.max(selRect.left + selRect.width / 2, 210), window.innerWidth - 210)
    const y = selRect.bottom + 8
    this.resultPanel.style.left = `${x}px`
    this.resultPanel.style.top = `${y}px`
    this.resultPanel.style.transform = 'translateX(-50%)'

    this.resultPanel.innerHTML = '<div class="la-loading">正在生成...</div>'
    this.wrapper.appendChild(this.resultPanel)

    this.isLoading = true
    let fullText = ''

    // Listen for streaming response
    const listener = (message: { type: string; text?: string; error?: string }) => {
      if (message.type === 'AI_CHUNK') {
        fullText = message.text ?? ''
        this.updateResult(fullText, true)
      } else if (message.type === 'AI_DONE') {
        this.isLoading = false
        this.updateResult(fullText, false)
        chrome.runtime.onMessage.removeListener(listener)
      } else if (message.type === 'AI_ERROR') {
        this.isLoading = false
        this.showError(message.error ?? '未知错误')
        chrome.runtime.onMessage.removeListener(listener)
      }
    }
    chrome.runtime.onMessage.addListener(listener)

    // Send request to background
    chrome.runtime.sendMessage(
      {
        type: 'STREAM_AI',
        payload: {
          template: action.prompt,
          variables: { text: this.selectedText },
        },
      },
      (response) => {
        if (chrome.runtime.lastError) {
          this.isLoading = false
          this.showError('扩展通信失败: ' + chrome.runtime.lastError.message)
          chrome.runtime.onMessage.removeListener(listener)
          return
        }
        if (response?.error) {
          this.isLoading = false
          this.showError(response.error)
          chrome.runtime.onMessage.removeListener(listener)
        }
      }
    )
  }

  private updateResult(text: string, loading: boolean) {
    if (!this.resultPanel) return

    const cursor = loading ? '<span class="la-cursor"></span>' : ''
    const actions = loading ? '' : `
      <div class="la-result-actions">
        <button class="la-small-btn copy" data-action="copy">复制</button>
        <button class="la-small-btn close" data-action="close">关闭</button>
      </div>
    `
    this.resultPanel.innerHTML = `
      <div class="la-result-text">${this.escapeHtml(text)}${cursor}</div>
      ${actions}
    `

    // Bind action buttons
    if (!loading) {
      const copyBtn = this.resultPanel.querySelector('[data-action="copy"]')
      const closeBtn = this.resultPanel.querySelector('[data-action="close"]')
      copyBtn?.addEventListener('click', (e) => {
        e.stopPropagation()
        navigator.clipboard.writeText(text).then(() => {
          if (copyBtn) (copyBtn as HTMLElement).textContent = '已复制 ✓'
          setTimeout(() => { if (copyBtn) (copyBtn as HTMLElement).textContent = '复制' }, 1500)
        })
      })
      closeBtn?.addEventListener('click', (e) => {
        e.stopPropagation()
        this.hide()
      })
    }
  }

  private showError(msg: string) {
    if (!this.resultPanel) return
    this.resultPanel.innerHTML = `
      <div class="la-error">${this.escapeHtml(msg)}</div>
      <div class="la-result-actions">
        <button class="la-small-btn close" data-action="close">关闭</button>
      </div>
    `
    const closeBtn = this.resultPanel.querySelector('[data-action="close"]')
    closeBtn?.addEventListener('click', (e) => {
      e.stopPropagation()
      this.hide()
    })
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>')
  }

  hide() {
    if (this.toolbar) { this.toolbar.remove(); this.toolbar = null }
    if (this.resultPanel) { this.resultPanel.remove(); this.resultPanel = null }
    this.isVisible = false
    this.isLoading = false
  }
}

// ========== Initialize ==========

function init() {
  if (document.getElementById('lightask-select-act')) return
  new SelectAndActToolbar()
}

if (document.documentElement) {
  init()
} else {
  document.addEventListener('DOMContentLoaded', init)
}
