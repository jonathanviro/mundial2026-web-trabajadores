import { create } from 'zustand'
import type { Screen, Campaign, Employee, Phase, Match, Prediction, RankingEntry } from '../types'

interface AppStore {
  screen: Screen
  setScreen: (s: Screen) => void

  campaign: Campaign | null
  setCampaign: (c: Campaign) => void

  employee: Employee | null
  setEmployee: (e: Employee) => void

  phase: Phase | null
  matches: Match[]
  allMatches: Match[]
  predictionDate: string | null
  setPhaseData: (phase: Phase | null, matches: Match[], predictionDate?: string | null, allMatches?: Match[]) => void

  predictions: Prediction[]
  updatePrediction: (match_id: number, field: 'goals_local' | 'goals_visitor', value: number) => void
  clearPredictions: () => void

  champion: string | null
  setChampion: (team: string | null) => void

  ranking: RankingEntry[]
  setRanking: (r: RankingEntry[]) => void

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
  allMatches: [],
  predictionDate: null,
  setPhaseData: (phase, matches, predictionDate = null, allMatches = []) => set({ phase, matches, predictionDate, allMatches }),

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

  ranking: [],
  setRanking: (ranking) => set({ ranking }),

  submitting: false,
  setSubmitting: (submitting) => set({ submitting }),

  error: null,
  setError: (error) => set({ error }),

  reset: () =>
    set({
      screen: 'splash',
      phase: null,
      matches: [],
      allMatches: [],
      predictionDate: null,
      predictions: [],
      champion: null,
      ranking: [],
      submitting: false,
      error: null,
    }),
}))
