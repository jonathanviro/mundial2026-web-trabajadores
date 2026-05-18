import { create } from 'zustand'
import type { Screen, Campaign, Employee, Phase, Match, Prediction } from '../types'

interface AppStore {
  screen: Screen
  setScreen: (s: Screen) => void

  campaign: Campaign | null
  setCampaign: (c: Campaign) => void

  employee: Employee | null
  setEmployee: (e: Employee) => void

  phase: Phase | null
  matches: Match[]
  setPhaseData: (phase: Phase | null, matches: Match[]) => void

  predictions: Prediction[]
  updatePrediction: (match_id: number, field: 'goals_local' | 'goals_visitor', value: number) => void
  clearPredictions: () => void

  champion: string | null
  setChampion: (team: string | null) => void

  submitting: boolean
  setSubmitting: (v: boolean) => void

  error: string | null
  setError: (e: string | null) => void

  reset: () => void
}

export const useStore = create<AppStore>((set) => ({
  screen: 'splash',
  setScreen: (screen) => set({ screen, error: null }),

  campaign: null,
  setCampaign: (campaign) => set({ campaign }),

  employee: null,
  setEmployee: (employee) => set({ employee }),

  phase: null,
  matches: [],
  setPhaseData: (phase, matches) => set({ phase, matches }),

  predictions: [],
  updatePrediction: (match_id, field, value) =>
    set((s) => {
      const existing = s.predictions.find((p) => p.match_id === match_id)
      if (existing) {
        return {
          predictions: s.predictions.map((p) =>
            p.match_id === match_id ? { ...p, [field]: Math.max(0, value) } : p,
          ),
        }
      }
      return {
        predictions: [
          ...s.predictions,
          { match_id, goals_local: field === 'goals_local' ? value : 0, goals_visitor: field === 'goals_visitor' ? value : 0 },
        ],
      }
    }),
  clearPredictions: () => set({ predictions: [], champion: null }),

  champion: null,
  setChampion: (champion) => set({ champion }),

  submitting: false,
  setSubmitting: (submitting) => set({ submitting }),

  error: null,
  setError: (error) => set({ error }),

  reset: () =>
    set({
      screen: 'splash',
      phase: null,
      matches: [],
      predictions: [],
      champion: null,
      submitting: false,
      error: null,
    }),
}))
