// Global Zustand store shared across popup, side panel, and content scripts
import { create } from 'zustand'

interface AppState {
  // Current active scene
  activeSceneId: string | null
  setActiveScene: (id: string | null) => void

  // AI generation state
  isGenerating: boolean
  generatedText: string
  generationError: string | null
  setGenerating: (v: boolean) => void
  setGeneratedText: (v: string) => void
  setGenerationError: (v: string | null) => void
  resetGeneration: () => void

  // Side panel tab
  activeSidePanelTab: 'copilot' | 'scenes' | 'history'
  setSidePanelTab: (tab: 'copilot' | 'scenes' | 'history') => void
}

export const useAppStore = create<AppState>((set) => ({
  activeSceneId: null,
  setActiveScene: (id) => set({ activeSceneId: id }),

  isGenerating: false,
  generatedText: '',
  generationError: null,
  setGenerating: (v) => set({ isGenerating: v }),
  setGeneratedText: (v) => set({ generatedText: v }),
  setGenerationError: (v) => set({ generationError: v }),
  resetGeneration: () => set({ isGenerating: false, generatedText: '', generationError: null }),

  activeSidePanelTab: 'copilot',
  setSidePanelTab: (tab) => set({ activeSidePanelTab: tab }),
}))
