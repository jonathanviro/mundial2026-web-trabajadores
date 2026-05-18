import { useEffect, useState } from 'react'
import { useStore } from '../store'
import { webApi } from '../api'
import { Trophy, ArrowRight, History, LogOut } from 'lucide-react'

export default function DashboardPage() {
  const { employee, phase, matches, setPhaseData, setScreen, reset } = useStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    webApi.getPhase()
      .then((data) => {
        setPhaseData(data.phase, data.matches)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleLogout = () => {
    sessionStorage.clear()
    reset()
  }

  return (
    <div className="bg-[#1a2332]/90 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">
            Hola, {employee?.nombres || employee?.code}
          </h1>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 text-[#7a8899] hover:text-red-400 transition-colors rounded-lg hover:bg-white/5"
          title="Cerrar sesión"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : phase ? (
        <div className="space-y-4">
          {/* Phase card */}
          <div className="bg-[#0f1923] rounded-xl p-5 border border-white/5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="font-semibold">{phase.name}</p>
                <p className="text-xs text-[#7a8899]">
                  {phase.date_from && phase.date_to
                    ? `${phase.date_from} → ${phase.date_to}`
                    : `${matches.length} partidos`}
                </p>
              </div>
            </div>

            <button
              onClick={() => setScreen('predict')}
              className="w-full py-3 rounded-lg bg-accent text-white font-semibold
                         hover:bg-accent/90 active:scale-[0.98] transition-all
                         flex items-center justify-center gap-2"
            >
              Participar <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* My predictions link */}
          <button
            onClick={() => setScreen('my-predictions')}
            className="w-full py-3 rounded-lg bg-white/5 text-sm text-[#7a8899]
                       hover:text-[#e8eaf0] hover:bg-white/10 transition-all
                       flex items-center justify-center gap-2"
          >
            <History className="w-4 h-4" /> Historial de predicciones
          </button>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-[#7a8899]">No hay una fase activa disponible</p>
          <p className="text-xs text-[#4a5568] mt-1">Espera a que el administrador publique una nueva fase</p>
        </div>
      )}
    </div>
  )
}
