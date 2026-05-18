import { useEffect, useState } from 'react'
import { useStore } from '../store'
import { webApi } from '../api'
import { Flag } from '../components/Flag'
import { ArrowLeft, Calendar } from 'lucide-react'
import type { Registration } from '../types'

export default function MyPredictionsPage() {
  const { setScreen } = useStore()
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    webApi.myPredictions()
      .then(setRegistrations)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex flex-col h-full">
      <div className="bg-black/40 backdrop-blur-md border-b border-white/10 flex-shrink-0 px-4 md:px-8 py-4">
        <div className="flex items-center justify-between">
          <button onClick={() => setScreen('dashboard')}
            className="text-[#7a8899] hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="font-bold text-base">Mis predicciones</h2>
          <div className="w-5" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto py-6 px-4 md:px-8">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : registrations.length === 0 ? (
            <div className="text-center py-16">
              <Calendar className="w-10 h-10 text-[#4a5568] mx-auto mb-3" />
              <p className="text-[#7a8899]">No tienes predicciones aún</p>
              <p className="text-xs text-[#4a5568] mt-1">Participa en la fase activa para verlas aquí</p>
            </div>
          ) : (
            <div className="space-y-4">
              {registrations.map((reg) => (
                <div key={reg.id} className="bg-white/10 backdrop-blur-md rounded-xl p-4 md:p-5 border border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-sm">{reg.phase?.name}</span>
                    <span className="text-xs text-[#7a8899]">
                      {new Date(reg.registered_at).toLocaleDateString('es-EC')}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {reg.predictions?.map((pred) => (
                      <div key={pred.match_id}
                        className="flex items-center justify-between gap-3 text-sm">
                        <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
                          <span className="truncate text-[#7a8899]">{pred.match?.team_local}</span>
                          <Flag team={pred.match?.team_local} size={16} />
                        </div>
                        <span className={`font-mono font-bold flex-shrink-0 ${pred.is_correct ? 'text-green-400' : 'text-accent'}`}>
                          {pred.goals_local} - {pred.goals_visitor}
                        </span>
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <Flag team={pred.match?.team_visitor} size={16} />
                          <span className="truncate text-[#7a8899]">{pred.match?.team_visitor}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {reg.champion_team && (
                    <div className="mt-3 pt-3 border-t border-white/10 text-center flex items-center justify-center gap-2">
                      <span className="text-xs text-[#7a8899]">Campeón:</span>
                      <Flag team={reg.champion_team} size={16} />
                      <span className="text-xs font-semibold text-yellow-500">{reg.champion_team}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
