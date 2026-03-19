// Background Service Worker: message hub + AI streaming relay for content scripts
import { streamAI } from './services/ai-router'

// ========== Message handling ==========

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'STREAM_AI') {
    const { template, variables } = message.payload

    const tabId = sender.tab?.id
    if (!tabId) {
      sendResponse({ error: '无法获取标签页' })
      return true
    }

    streamAI({
      template,
      variables,
      onChunk: (text) => {
        chrome.tabs.sendMessage(tabId, { type: 'AI_CHUNK', text }).catch(() => {})
      },
      onDone: (_fullText) => {
        chrome.tabs.sendMessage(tabId, { type: 'AI_DONE' }).catch(() => {})
      },
      onError: (err) => {
        chrome.tabs.sendMessage(tabId, { type: 'AI_ERROR', error: err.message }).catch(() => {})
      },
    })

    sendResponse({ ok: true })
    return true
  }

  return false
})

// ========== Side Panel setup ==========

chrome.sidePanel?.setPanelBehavior?.({ openPanelOnActionClick: false }).catch(() => {})

// ========== Keyboard shortcut ==========

chrome.commands.onCommand.addListener((command) => {
  if (command === 'toggle-sidepanel') {
    chrome.sidePanel?.open({ windowId: chrome.windows.WINDOW_ID_CURRENT }).catch(() => {})
  }
})

// ========== Context menu ==========

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'lightask-ask',
    title: '用轻问 AI 处理',
    contexts: ['selection'],
  })
})

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'lightask-ask' && tab?.id) {
    chrome.sidePanel?.open({ tabId: tab.id }).catch(() => {})
  }
})
