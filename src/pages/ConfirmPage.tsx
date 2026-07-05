import { useState } from 'react'
import { useStore } from '../store'
import { webApi } from '../api'
import { Flag } from '../components/Flag'
import { ArrowLeft, Check, AlertTriangle } from 'lucide-react'

export default function ConfirmPage() {
  const { phase, matches, predictions, champion, predictionDate, setScreen, setSubmitting, submitting, error, setError } = useStore()
  const isDaily = phase?.daily_predictions === true
  const [done, setDone] = useState(false)

  const getMatch = (matchId: number) => matches.find((m) => m.id === matchId)

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      await webApi.submitPredictions({
        predictions: predictions.map((p) => ({
          match_id: p.match_id,
          goals_local: p.goals_local,
          goals_visitor: p.goals_visitor,
        })),
        champion_team: isDaily ? undefined : (champion || undefined),
        prediction_date: isDaily ? (predictionDate || undefined) : undefined,
      })
      setDone(true)
      setScreen('success')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al enviar predicciones')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="bg-black/40 backdrop-blur-md border-b border-white/10 flex-shrink-0 px-4 md:px-8 py-4">
        <div className="flex items-center justify-between">
          <button onClick={() => setScreen('dashboard')}
            className="text-[#7a8899] hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="font-bold text-base">Confirmar predicciones</h2>
          <div className="w-5" />
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="min-h-full flex flex-col">
          <div className="flex-[0.5]" />
          <div className="shrink-0 w-full max-w-4xl mx-auto py-6 px-4 md:px-8 space-y-3">
            {predictions.map((pred) => {
              const match = getMatch(pred.match_id)
              return (
                <div key={pred.match_id}
                  className="bg-white/10 backdrop-blur-md rounded-xl px-4 py-3 border border-white/10
                             flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
                    <span className="text-sm font-medium truncate">{match?.team_local}</span>
                    <Flag team={match?.team_local} size={20} />
                  </div>
                  <span className="font-mono font-bold text-accent text-lg flex-shrink-0">
                    {pred.goals_local} - {pred.goals_visitor}
                  </span>
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Flag team={match?.team_visitor} size={20} />
                    <span className="text-sm font-medium truncate">{match?.team_visitor}</span>
                  </div>
                </div>
              )
            })}

            {!isDaily && champion && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3 text-center">
                <p className="text-xs text-[#7a8899] mb-1">Campeón</p>
                <p className="font-semibold text-yellow-500 flex items-center justify-center gap-2">
                  <Flag team={champion} size={22} /> {champion}
                </p>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <button onClick={handleSubmit} disabled={submitting || done}
              className="w-full py-3 rounded-xl bg-accent text-white font-bold text-base
                         hover:bg-accent/90 active:scale-[0.98] transition-all
                         flex items-center justify-center gap-2
                         disabled:opacity-40 disabled:cursor-not-allowed">
              {submitting ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Enviando...</>
              ) : (
                <><Check className="w-4 h-4" /> Confirmar y enviar</>
              )}
            </button>
          </div>
          <div className="flex-1" />
        </div>
      </div>
    </div>
  )
}
