export interface Campaign {
  id: number
  name: string
  slug: string
  logo_url?: string | null
  web_bg_url?: string | null
  control_employees: boolean
}

export interface Employee {
  id: string
  code: string
  nombres: string
  apellidos?: string | null
  email?: string | null
  telefono?: string | null
}

export interface Phase {
  id: number
  number: number
  name: string
  date_from?: string | null
  date_to?: string | null
  predictions_required: number
  min_correct_to_win: number
  version: number
}

export interface Match {
  id: number
  phase_id: number
  match_number: number
  group_name?: string | null
  team_local?: string | null
  team_visitor?: string | null
  goals_local?: number | null
  goals_visitor?: number | null
  finished: boolean
}

export interface Prediction {
  match_id: number
  goals_local: number
  goals_visitor: number
  match?: Match
}

export interface Registration {
  id: number
  phase: Phase
  predictions: (Prediction & { is_correct: boolean })[]
  champion_team?: string | null
  registered_at: string
}

export interface PhaseResponse {
  phase: Phase | null
  matches: Match[]
  already_submitted: boolean
}

export type Screen = 'splash' | 'login' | 'dashboard' | 'predict' | 'confirm' | 'success' | 'my-predictions' | 'done'
