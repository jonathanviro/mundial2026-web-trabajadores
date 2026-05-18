import { useState, useMemo, useEffect } from 'react'
import { useStore } from '../store'
import { webApi } from '../api'
import { Flag } from '../components/Flag'
import { ArrowLeft, ArrowRight, Minus, Plus, X, Check } from 'lucide-react'

function Stepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-0.5">
      <button type="button" onClick={() => onChange(Math.max(0, value - 1))}
        className="w-8 h-8 rounded-l-lg bg-white/10 flex items-center justify-center
                   hover:bg-white/20 transition-colors text-[#7a8899]">
        <Minus className="w-3.5 h-3.5" />
      </button>
      <span className="w-10 h-8 flex items-center justify-center bg-white/10
                       font-mono font-bold text-sm">{value}</span>
      <button type="button" onClick={() => onChange(value + 1)}
        className="w-8 h-8 rounded-r-lg bg-white/10 flex items-center justify-center
                   hover:bg-white/20 transition-colors text-[#7a8899]">
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

function buildTeams(matches: any[]) {
  const map = new Map<string, { name: string; matchIds: number[] }>()
  matches.forEach((m: any) => {
    if (m.team_local && !map.has(m.team_local))
      map.set(m.team_local, { name: m.team_local, matchIds: [] })
    if (m.team_local) map.get(m.team_local)!.matchIds.push(m.id)
    if (m.team_visitor && !map.has(m.team_visitor))
      map.set(m.team_visitor, { name: m.team_visitor, matchIds: [] })
    if (m.team_visitor) map.get(m.team_visitor)!.matchIds.push(m.id)
  })
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
}

export default function PredictPage() {
  const { phase, matches, predictions, updatePrediction, champion, setChampion, setScreen, reset, setPhaseData } = useStore()
  const required = phase?.predictions_required || 3
  const done = predictions.length

  const [selectedTeam, setSelectedTeam] = useState<string | null>(null)
  const [showChampionModal, setShowChampionModal] = useState(false)

  const isGroupPhase = phase?.number === 1
  const teams = useMemo(() => buildTeams(matches), [matches])

  useEffect(() => {
    if (phase) return
    webApi.getPhase()
      .then((data) => {
        setPhaseData(data.phase, data.matches)
        if (data.already_submitted) setScreen('done')
      })
      .catch(() => {})
  }, [])

  const filteredMatches = useMemo(() => {
    if (!selectedTeam) return matches
    return matches.filter(
      (m) => m.team_local === selectedTeam || m.team_visitor === selectedTeam
    )
  }, [matches, selectedTeam])

  const showTeamGrid = isGroupPhase && !selectedTeam

  const canAdd = done < required

  const handleAdd = (matchId: number) => {
    if (!canAdd) return
    if (predictions.find(p => p.match_id === matchId)) return
    updatePrediction(matchId, 'goals_local', 0)
  }

  const handleRemovePrediction = (matchId: number) => {
    // We can't remove from store, but we can set goals to -1 to mark for removal
    // Actually, let's just set both goals to 0 and clear it from predictions
    // The issue is there's no removePrediction in the store
    // I'll need to use set with a filtered array
    // For now, let's override the updatePrediction to support removal by setting a flag
    // Actually, I'll just use the store directly
    useStore.setState((s) => ({
      predictions: s.predictions.filter(p => p.match_id !== matchId)
    }))
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="bg-black/40 backdrop-blur-md border-b border-white/10 flex-shrink-0">
        <div className="flex items-center justify-between px-4 md:px-8 py-3">
          <button onClick={() => setSelectedTeam(null)}
            className={`text-[#7a8899] hover:text-white transition-colors ${showTeamGrid ? 'invisible' : ''}`}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <div className="text-xs text-[#7a8899] uppercase tracking-wider">
              {showTeamGrid ? 'Elige un equipo' : selectedTeam || phase?.name}
            </div>
            <div className="text-sm font-bold">{phase?.name}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-[#7a8899]">Predicciones</div>
            <div className={`text-xl font-black ${done >= required ? 'text-green-400' : 'text-accent'}`}>
              {done} / {required}
            </div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-white/10">
          <div
            className={`h-full transition-all duration-300 ${done >= required ? 'bg-green-400' : 'bg-accent'}`}
            style={{ width: `${Math.min((done / required) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="flex flex-col items-center py-6 px-4 md:px-8">
          {/* TEAM GRID (Phase 1 only) */}
          {showTeamGrid && (
            <div className="w-full max-w-none">
              {done < required && (
                <>
                  <p className="text-center text-lg font-bold mb-1">Toca un equipo para ver sus partidos</p>
                  <p className="text-center text-sm text-[#7a8899] mb-6">
                    Selecciona {required - done} predicción{required - done !== 1 ? 'es' : ''} más para continuar
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                    {teams.map((team) => (
                      <button key={team.name} onClick={() => setSelectedTeam(team.name)}
                        className="bg-white/[0.22] backdrop-blur-md rounded-xl p-3 flex flex-col items-center gap-2
                                   border border-white/20 hover:bg-white/30 active:scale-95 transition-all
                                   shadow-lg shadow-black/20">
                        <Flag team={team.name} size={36} />
                        <span className="text-xs font-bold text-center leading-tight">{team.name}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Already predicted cards */}
              {predictions.length > 0 && (
                <div className="mt-8 w-full max-w-4xl mx-auto">
                  <div className="text-sm font-bold uppercase tracking-wider text-[#7a8899] mb-3">
                    Mis predicciones
                  </div>

                  {done < required && (
                    <p className="text-xs text-[#7a8899] mb-3">
                      Si quieres seleccionar otro equipo, elimina una predicción
                    </p>
                  )}
                  {done >= required && (
                    <p className="text-xs text-yellow-500 mb-3 font-medium">
                      ¡Completaste tus predicciones! Ahora predice el campeón del mundo
                    </p>
                  )}

              <div className="grid grid-cols-1 gap-3">
                    {predictions.map((p) => {
                      const m = matches.find(me => me.id === p.match_id)
                      return (
                        <div key={p.match_id}
                          className="bg-white/15 backdrop-blur-md rounded-xl px-4 py-3 border border-white/10">
                          <div className="flex items-center justify-center gap-2">
                            <Flag team={m?.team_local} size={22} />
                            <span className="text-sm font-bold truncate">{m?.team_local}</span>
                            <span className="text-accent font-bold text-sm flex-shrink-0">{p.goals_local}:{p.goals_visitor}</span>
                            <span className="text-sm font-bold truncate">{m?.team_visitor}</span>
                            <Flag team={m?.team_visitor} size={22} />
                          </div>
                          <div className="text-center mt-2">
                            <button onClick={() => handleRemovePrediction(p.match_id)}
                              className="text-xs text-red-400 hover:text-red-300">
                              Quitar predicción
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MATCHES LIST */}
          {!showTeamGrid && (
            <div className="w-full max-w-4xl mx-auto">
              {filteredMatches.length === 0 && (
                <div className="text-center py-16 text-[#7a8899]">No hay partidos disponibles</div>
              )}
              <div className="grid grid-cols-1 gap-3">
                {filteredMatches.map((match) => {
                  const pred = predictions.find(p => p.match_id === match.id)
                  const isPredicted = !!pred
                  return (
                    <div key={match.id}
                      className={`rounded-xl p-4 border backdrop-blur-md transition-all ${
                        isPredicted
                          ? 'bg-green-500/20 border-green-500/40'
                          : 'bg-white/[0.22] border-white/20'
                      }`}
                      style={{ boxShadow: '0 8px 32px rgba(0,0,0,.2), inset 0 1px 0 rgba(255,255,255,.06)' }}
                    >
                      <div className="flex items-center gap-2">
                        {/* Local column */}
                        <div className="flex-1 flex flex-col items-center text-center">
                          <Flag team={match.team_local} size={36} />
                          <div className="text-xs md:text-sm font-bold mt-1 leading-tight mb-2">{match.team_local}</div>
                          {isPredicted && (
                            <Stepper value={pred.goals_local}
                              onChange={(v) => updatePrediction(match.id, 'goals_local', v)} />
                          )}
                        </div>

                        {/* Center */}
                        <div className="flex flex-col items-center pt-8 flex-shrink-0">
                          {isPredicted ? (
                            <span className="text-lg font-bold text-[#7a8899]">:</span>
                          ) : (
                            <button onClick={() => handleAdd(match.id)}
                              disabled={!canAdd}
                              className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                                canAdd
                                  ? 'bg-green-500 text-white hover:bg-green-400 active:scale-95'
                                  : 'bg-white/10 text-[#7a8899] cursor-not-allowed'
                              }`}>
                              + Predecir
                            </button>
                          )}
                        </div>

                        {/* Visitor column */}
                        <div className="flex-1 flex flex-col items-center text-center">
                          <Flag team={match.team_visitor} size={36} />
                          <div className="text-xs md:text-sm font-bold mt-1 leading-tight mb-2">{match.team_visitor}</div>
                          {isPredicted && (
                            <Stepper value={pred.goals_visitor}
                              onChange={(v) => updatePrediction(match.id, 'goals_visitor', v)} />
                          )}
                        </div>
                      </div>

                      {isPredicted && (
                        <div className="text-center mt-3">
                          <button onClick={() => handleRemovePrediction(match.id)}
                            className="text-xs text-red-400 hover:text-red-300">
                            Quitar predicción
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Champion section */}
          {done >= required && (
            <div className="w-full max-w-4xl mt-8 mx-auto">
              <div className="text-center text-sm font-bold uppercase tracking-wider text-yellow-500 mb-3">
                Mi campeón del mundo
              </div>
              <button onClick={() => setShowChampionModal(true)}
                className={`w-full rounded-xl p-4 border-2 backdrop-blur-md transition-all ${
                  champion
                    ? 'bg-yellow-500/10 border-yellow-500/40'
                    : 'bg-yellow-500/5 border-dashed border-yellow-500/20 hover:bg-yellow-500/10'
                }`}>
                {champion ? (
                  <div className="flex items-center justify-center gap-3">
                    <Flag team={champion} size={40} />
                    <span className="text-lg font-bold text-yellow-500">{champion}</span>
                  </div>
                ) : (
                  <div>
                    <div className="text-lg font-bold text-yellow-500">Campeón del mundo</div>
                    <div className="text-sm text-yellow-500/60">Toca para elegir tu campeón</div>
                  </div>
                )}
              </button>
            </div>
          )}

      {/* Back to teams */}
      {selectedTeam && (
        <button onClick={() => setSelectedTeam(null)}
          className="mt-6 text-sm text-[#7a8899] hover:text-white transition-colors">
          ← Volver a equipos
        </button>
      )}

      {/* Ver resumen */}
      <div className="w-full max-w-4xl mt-6 mx-auto">
        <button onClick={() => {
            if (done < required) {
              alert(`Debes hacer al menos ${required} predicciones`)
              return
            }
            if (!champion) {
              alert('Debes seleccionar un campeón')
              return
            }
            setScreen('confirm')
          }}
          className={`w-full py-3 px-6 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 ${
            done >= required && champion
              ? 'bg-accent text-white hover:bg-accent/90 active:scale-[0.98]'
              : 'bg-white/10 text-[#7a8899] cursor-not-allowed'
          }`}
          disabled={done < required || !champion}>
          Ver resumen <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>

      {/* Champion selection — full screen */}
      {showChampionModal && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#0a1628]/90 backdrop-blur-md">
          <div className="bg-black/40 backdrop-blur-md border-b border-white/10 flex-shrink-0">
            <div className="flex items-center justify-between px-4 md:px-8 py-3">
              <div />
              <div className="text-center">
                <div className="text-xs text-[#7a8899] uppercase tracking-wider">Elige tu campeón</div>
                <div className="text-sm font-bold">Campeón del mundo</div>
              </div>
              <button onClick={() => setShowChampionModal(false)}
                className="text-[#7a8899] hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

      <div className="flex-1 overflow-y-auto min-h-0">
            <div className="flex flex-col items-center px-4 md:px-8 py-6">
              <div className="w-full max-w-none">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                  {teams.map((team) => (
                    <button key={team.name}
                      onClick={() => { setChampion(team.name); setShowChampionModal(false) }}
                      className={`rounded-xl p-3 flex flex-col items-center gap-2 border transition-all ${
                        champion === team.name
                          ? 'bg-accent/20 border-accent'
                          : 'bg-white/[0.22] border-white/20 hover:bg-white/30'
                      }`}>
                      <Flag team={team.name} size={36} />
                      <span className="text-xs font-bold text-center leading-tight">{team.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
