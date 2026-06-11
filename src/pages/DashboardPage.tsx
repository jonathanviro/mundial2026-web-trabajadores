import { useEffect, useState, useMemo } from "react";
import { useStore } from "../store";
import { webApi } from "../api";
import { Flag } from "../components/Flag";
import {
  Minus,
  Plus,
  Check,
  LogOut,
  Trophy,
  X,
  AlertTriangle,
} from "lucide-react";
import type { RankingEntry, Registration, Match } from "../types";

function Stepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-0">
      <button
        type="button"
        onClick={() => onChange(Math.max(0, value - 1))}
        className="w-7 h-7 rounded-l-md bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors text-[#7a8899]"
      >
        <Minus className="w-3 h-3" />
      </button>
      <span className="w-8 h-7 flex items-center justify-center bg-white/10 font-mono font-bold text-sm">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="w-7 h-7 rounded-r-md bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors text-[#7a8899]"
      >
        <Plus className="w-3 h-3" />
      </button>
    </div>
  );
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("es-EC", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function DashboardPage() {
  const {
    employee,
    phase,
    matches,
    allMatches,
    predictionDate,
    predictions,
    updatePrediction,
    clearPredictions,
    champion,
    setScreen,
    setPhaseData,
    setRanking,
    ranking,
    submitting,
    setSubmitting,
    error,
    setError,
    reset,
  } = useStore();

  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [myRanking, setMyRanking] = useState<RankingEntry | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedDate, setSubmittedDate] = useState<string | null>(null);
  const [upcomingDate, setUpcomingDate] = useState<string | null>(null);
  const [nextBatch, setNextBatch] = useState<Match[]>([]);

  const isDaily = phase?.daily_predictions === true;
  const allDatesDone = isDaily && !predictionDate && !loading && registrations.length > 0;

  useEffect(() => {
    Promise.all([
      webApi.getPhase(),
      webApi.getRanking(),
      webApi.myPredictions(),
    ])
      .then(([phaseData, rankRes, preds]) => {
        setPhaseData(
          phaseData.phase,
          phaseData.matches,
          phaseData.prediction_date,
          phaseData.all_matches,
        );
        setRanking(rankRes.ranking || []);
        setRegistrations(preds || []);

        // Compute upcoming matches
        const all = phaseData.all_matches || [];
        const today = new Date().toISOString().split("T")[0];
        const upcoming = [...all]
          .filter((m: any) => !m.finished && m.date && m.date > today)
          .sort((a: any, b: any) => (a.date || "").localeCompare(b.date || ""));
        const firstDate = upcoming.length > 0 ? upcoming[0].date : null;
        setUpcomingDate(firstDate);
        setNextBatch(
          firstDate ? upcoming.filter((m: any) => m.date === firstDate) : [],
        );

        if (employee) {
          setMyRanking(
            (rankRes.ranking || []).find(
              (r: RankingEntry) => r.code === employee.code,
            ) || null,
          );
        }
        const existing = preds?.find(
          (r: Registration) => r.prediction_date === phaseData.prediction_date,
        );
        if (existing) {
          setSubmitted(true);
          setSubmittedDate(phaseData.prediction_date);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const topRanking = ranking.slice(0, 10);
  const lastRegs = registrations.slice(0, 5);

  const allPreds = registrations.flatMap((r) => r.predictions || []);
  const totalPreds = allPreds.length;
  const correctResults = allPreds.filter(
    (p: any) => p.points && p.points > 0,
  ).length;
  const exactScores = allPreds.filter((p: any) => p.points === 2).length;
  const accuracy =
    totalPreds > 0 ? Math.round((correctResults / totalPreds) * 100) : 0;

  const todayStr = new Date().toISOString().split("T")[0];
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });
  const pointsHistory = last7Days.map((date) => ({
    date,
    points: registrations
      .filter((r) => r.prediction_date === date)
      .reduce((sum, r) => sum + (r.total_points || 0), 0),
  }));
  const maxPoints = Math.max(...pointsHistory.map((p) => p.points), 1);

  const todayFinished = matches.filter(
    (m) => m.date === todayStr && m.finished,
  );
  // upcomingDate and nextBatch are set in the useEffect above
  const availableDateStr = upcomingDate
    ? new Date(new Date(upcomingDate + 'T00:00:00').getTime() - 86400000).toISOString().split('T')[0]
    : null;

  const canPredict =
    isDaily && matches.length > 0 && predictionDate && !submitted;
  const doneCount = predictions.length;

  const required = matches.length;

  const handleAdd = (matchId: number) => {
    if (predictions.find((p) => p.match_id === matchId)) return;
    updatePrediction(matchId, "goals_local", 0);
  };

  const handleRemovePrediction = (matchId: number) => {
    useStore.setState((s) => ({
      predictions: s.predictions.filter((p) => p.match_id !== matchId),
    }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await webApi.submitPredictions({
        predictions: predictions.map((p) => ({
          match_id: p.match_id,
          goals_local: p.goals_local,
          goals_visitor: p.goals_visitor,
        })),
        prediction_date: predictionDate || undefined,
      });
      setSubmitted(true);
      setSubmittedDate(predictionDate);
      setShowConfirm(false);
      clearPredictions();
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al enviar predicciones");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.clear();
    reset();
    setScreen("login");
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-black/40 backdrop-blur-md border-b border-white/10 flex-shrink-0 px-4 md:px-8 py-3">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs text-[#7a8899] truncate">{employee?.code}</p>
            <p className="text-base font-bold truncate">{employee?.nombres}</p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {myRanking && (
              <div className="text-right">
                <p className="text-lg font-bold text-accent">
                  #{myRanking.position}
                </p>
                <p className="text-[10px] text-[#7a8899] uppercase tracking-wider">
                  {myRanking.total_points} pts
                </p>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="p-1.5 text-[#7a8899] hover:text-red-400 transition-colors rounded-lg hover:bg-white/5"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
        {/* Progress bar when predicting */}
        {canPredict && doneCount > 0 && (
          <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all"
              style={{
                width: `${Math.min((doneCount / required) * 100, 100)}%`,
              }}
            />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="max-w-2xl mx-auto py-4 px-4 md:px-8 space-y-3">
          {/* ─── PREDICTION SECTION ─── */}
          {!phase ? (
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-6 text-center">
              <p className="text-lg font-bold text-[#7a8899]">
                🏟️ Próximamente
              </p>
              <p className="text-sm text-[#4a5568] mt-1">
                Las predicciones aún no están disponibles.
              </p>
            </div>
          ) : canPredict ? (
            <div className="bg-white/10 backdrop-blur-md border border-accent/30 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-white/10">
                <p className="font-semibold text-sm text-accent">
                  📅 {formatDate(predictionDate!)} - {matches.length} partido
                  {matches.length !== 1 ? "s" : ""}
                </p>
                <p className="text-xs text-[#7a8899]">
                  Predice los marcadores, luego envia
                </p>
              </div>
              <div className="px-4 py-2 space-y-1">
                {matches.map((match) => {
                  const pred = predictions.find((p) => p.match_id === match.id);
                  const isPredicted = !!pred;
                  return (
                    <div
                      key={match.id}
                      className={`px-2.5 py-2 rounded-lg transition-all ${isPredicted ? "bg-green-500/15" : "bg-white/[0.04]"}`}
                    >
                      {isPredicted ? (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Flag team={match.team_local} size={18} />
                              <span className="text-xs font-medium">
                                {match.team_local}
                              </span>
                            </div>
                            <Stepper
                              value={pred.goals_local}
                              onChange={(v) =>
                                updatePrediction(match.id, "goals_local", v)
                              }
                            />
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Flag team={match.team_visitor} size={18} />
                              <span className="text-xs font-medium">
                                {match.team_visitor}
                              </span>
                            </div>
                            <Stepper
                              value={pred.goals_visitor}
                              onChange={(v) =>
                                updatePrediction(match.id, "goals_visitor", v)
                              }
                            />
                          </div>
                          <button
                            onClick={() => handleRemovePrediction(match.id)}
                            className="w-full text-center text-xs text-red-400 font-medium bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-md py-1 transition-all mt-1"
                          >
                            ✖ Quitar predicción
                          </button>
                        </div>
                      ) : (
                        /* Not predicted: always horizontal */
                        <div className="flex items-center gap-1">
                          <div className="flex items-center gap-1 min-w-0 flex-1 justify-end">
                            <span className="text-xs truncate">
                              {match.team_local}
                            </span>
                            <Flag team={match.team_local} size={16} />
                          </div>
                          <span className="text-[10px] text-[#4a5568] uppercase mx-1 flex-shrink-0">
                            vs
                          </span>
                          <div className="flex items-center gap-1 min-w-0 flex-1">
                            <Flag team={match.team_visitor} size={16} />
                            <span className="text-xs truncate">
                              {match.team_visitor}
                            </span>
                          </div>
                          <button
                            onClick={() => handleAdd(match.id)}
                            className="text-xs px-2 py-1 rounded-md bg-accent/20 text-accent font-semibold hover:bg-accent/30 whitespace-nowrap flex-shrink-0"
                          >
                            + Predecir
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="px-4 py-3 border-t border-white/10">
                {error && (
                  <div className="flex items-center gap-2 mb-2 bg-red-500/10 rounded-lg px-3 py-2 text-xs text-red-400">
                    <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                <button
                  onClick={() => (doneCount === required ? setShowConfirm(true) : null)}
                  disabled={doneCount !== required}
                  className={`w-full py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                    doneCount === required
                      ? "bg-accent text-white hover:bg-accent/90 active:scale-[0.98]"
                      : "bg-white/10 text-[#e8eaf0] cursor-not-allowed"
                  }`}
                >
                  <Check className="w-4 h-4" />{" "}
                  {doneCount === required
                    ? `Enviar predicciones (${doneCount})`
                    : `Faltan ${required - doneCount} predicción${required - doneCount !== 1 ? "es" : ""}`}
                </button>
              </div>
            </div>
          ) : submitted && isDaily ? (
            <div className="bg-white/10 backdrop-blur-md border border-green-500/30 rounded-xl p-4 text-center">
              <p className="text-green-400 font-semibold text-sm">
                ✅ Predicciones enviadas para{" "}
                {submittedDate ? formatDate(submittedDate) : "hoy"}
              </p>
              <p className="text-xs text-[#7a8899] mt-1">
                Los resultados se actualizarán cuando terminen los partidos
              </p>
            </div>
          ) : allDatesDone ? (
            <div className="bg-white/10 backdrop-blur-md border border-green-500/30 rounded-xl p-6 text-center">
              <p className="text-lg font-bold text-green-400">
                🎉 Completaste todas las predicciones
              </p>
              <p className="text-sm text-[#7a8899] mt-1">
        Revisá los resultados y el ranking general.
              </p>
            </div>
          ) : isDaily && !predictionDate ? (
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-6 text-center">
              <p className="text-lg font-bold text-[#7a8899]">
                📅 Sin partidos programados
              </p>
              <p className="text-sm text-[#4a5568] mt-1">
                No hay partidos disponibles para la próxima fecha.
              </p>
            </div>
          ) : isDaily && matches.length === 0 && predictionDate ? (
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-6 text-center">
              <p className="text-lg font-bold text-[#7a8899]">
                ⏳ Sin partidos disponibles
              </p>
              <p className="text-sm text-[#4a5568] mt-1">
                Vuelve cuando haya partidos disponibles.
              </p>
            </div>
          ) : null}

          {/* ─── STATS SECTION ─── */}
          {totalPreds > 0 && (
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-xl font-bold text-accent">{accuracy}%</p>
                  <p className="text-[10px] text-[#7a8899] uppercase tracking-wider">
                    Precisión
                  </p>
                </div>
                <div>
                  <p className="text-xl font-bold text-green-400">
                    {correctResults}
                  </p>
                  <p className="text-[10px] text-[#7a8899] uppercase tracking-wider">
                    Aciertos
                  </p>
                </div>
                <div>
                  <p className="text-xl font-bold text-yellow-400">
                    {exactScores}
                  </p>
                  <p className="text-[10px] text-[#7a8899] uppercase tracking-wider">
                    Exactos
                  </p>
                </div>
              </div>
              <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-accent rounded-full transition-all"
                  style={{ width: `${accuracy}%` }}
                />
              </div>
            </div>
          )}

          {/* ─── POINTS HISTORY CHART ─── */}
          {pointsHistory.some((p) => p.points > 0) && (
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-accent text-sm">📈</span>
                <h3 className="font-semibold text-sm">
                  Puntaje últimos 7 días
                </h3>
              </div>
              <div className="flex items-end gap-1.5 h-20">
                {pointsHistory.map((day) => (
                  <div
                    key={day.date}
                    className="flex-1 flex flex-col items-center gap-1"
                  >
                    <div
                      className="w-full rounded-t-sm transition-all bg-gradient-to-t from-accent/60 to-accent"
                      style={{
                        height: `${(day.points / maxPoints) * 100}%`,
                        minHeight: day.points > 0 ? "4px" : "2px",
                        opacity: day.points > 0 ? 1 : 0.2,
                      }}
                    />
                    <span className="text-[8px] text-[#4a5568]">
                      {day.date.slice(5)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── TODAY'S RESULTS ─── */}
          {todayFinished.length > 0 && (
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-accent text-sm">✅</span>
                <h3 className="font-semibold text-sm">Resultados de hoy</h3>
              </div>
              <div className="space-y-1.5">
                {todayFinished.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white/[0.04] text-xs"
                  >
                    <div className="flex items-center gap-1.5 min-w-0 flex-1 justify-end">
                      <span className="truncate">{m.team_local}</span>
                      <Flag team={m.team_local} size={14} />
                    </div>
                    <span className="font-mono font-bold text-accent flex-shrink-0">
                      {m.goals_local}–{m.goals_visitor}
                    </span>
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <Flag team={m.team_visitor} size={14} />
                      <span className="truncate">{m.team_visitor}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── NEXT PREDICTION DATE ─── */}
          {upcomingDate &&
            upcomingDate !== predictionDate &&
            nextBatch.length > 0 && (
              <div className="bg-white/10 backdrop-blur-md border border-accent/20 rounded-xl p-4">
                <div className="text-center mb-3">
                  <p className="text-xs text-accent font-semibold">
                    📅 Próximos partidos: {formatDate(upcomingDate)}
                  </p>
                  <p className="text-[10px] text-[#7a8899] mt-0.5">
                    Disponibles para predecir el {availableDateStr ? formatDate(availableDateStr) : ''}
                  </p>
                </div>
                <div className="space-y-1">
                  {nextBatch.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] text-xs"
                    >
                      <div className="flex items-center gap-1.5 min-w-0 flex-1 justify-end">
                        <span className="truncate">{m.team_local}</span>
                        <Flag team={m.team_local} size={14} />
                      </div>
                      <span className="text-[10px] text-[#4a5568] flex-shrink-0">
                        vs
                      </span>
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <Flag team={m.team_visitor} size={14} />
                        <span className="truncate">{m.team_visitor}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* ─── RANKING SECTION ─── */}
          {topRanking.length > 0 && (
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="w-4 h-4 text-accent" />
                <h3 className="font-semibold text-sm">Ranking General</h3>
              </div>
              <div className="space-y-1">
                {topRanking.map((entry) => {
                  const isMe = entry.code === employee?.code;
                  const medals = ["🥇", "🥈", "🥉"];
                  return (
                    <div
                      key={entry.code}
                      className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm ${isMe ? "bg-accent/10 border border-accent/30" : "hover:bg-white/[0.03]"}`}
                    >
                      <span className="w-5 text-center text-xs font-bold text-[#7a8899]">
                        {entry.position <= 3
                          ? medals[entry.position - 1]
                          : entry.position}
                      </span>
                      <span className="flex-1 truncate text-[#e8eaf0]">
                        {entry.code}{" "}
                        {isMe && (
                          <span className="text-accent text-[10px]">(tú)</span>
                        )}
                      </span>
                      <span className="font-bold text-accent text-xs">
                        {entry.total_points} pts
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─── RESULTS SECTION ─── */}
          {lastRegs.length > 0 && (
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-accent text-sm">📋</span>
                <h3 className="font-semibold text-sm">Mis resultados</h3>
              </div>
              <div className="space-y-2">
                {lastRegs.map((reg) => (
                  <div key={reg.id} className="bg-white/[0.04] rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] text-[#7a8899] uppercase">
                        {reg.prediction_date
                          ? formatDate(reg.prediction_date)
                          : new Date(reg.registered_at).toLocaleDateString(
                              "es-EC",
                            )}
                      </span>
                      {reg.total_points !== undefined && (
                        <span
                          className={`text-xs font-bold ${reg.total_points > 0 ? "text-green-400" : "text-[#7a8899]"}`}
                        >
                          {reg.total_points > 0
                            ? `+${reg.total_points} pts`
                            : "0 pts"}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      {(reg.predictions || []).slice(0, 4).map((pred: any) => {
                        const gl = pred.match?.goals_local;
                        const gv = pred.match?.goals_visitor;
                        const hasResult =
                          gl !== null &&
                          gl !== undefined &&
                          gv !== null &&
                          gv !== undefined;
                        return (
                          <div
                            key={pred.match_id || pred.id}
                            className="flex items-center justify-between gap-2 text-xs"
                          >
                            <div className="flex items-center gap-1 min-w-0 flex-1 justify-end">
                              <span className="truncate text-[#e8eaf0]">
                                {pred.match?.team_local}
                              </span>
                              <Flag team={pred.match?.team_local} size={14} />
                            </div>
                            <span
                              className={`font-mono font-bold flex-shrink-0 ${pred.is_correct ? "text-green-400" : pred.points && pred.points > 0 ? "text-yellow-400" : "text-[#e8eaf0]"}`}
                            >
                              {pred.goals_local}–{pred.goals_visitor}
                            </span>
                            <div className="flex items-center gap-1 min-w-0 flex-1">
                              <Flag team={pred.match?.team_visitor} size={14} />
                              <span className="truncate text-[#e8eaf0]">
                                {pred.match?.team_visitor}
                              </span>
                            </div>
                            {hasResult && (
                              <span
                                className={`text-[10px] flex-shrink-0 ml-1 ${pred.is_correct ? "text-green-400" : pred.points && pred.points > 0 ? "text-yellow-400" : "text-red-400"}`}
                              >
                                {gl}–{gv}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="h-4" />
        </div>
      </div>

      {/* ─── CONFIRM MODAL ─── */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#1a2332] rounded-2xl border border-white/10 p-5 animate-fade-in shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base">Confirmar predicciones</h3>
              <button
                onClick={() => setShowConfirm(false)}
                className="text-[#7a8899] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ⚠️ Advertencia */}
            <div className="p-3 mb-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-400 text-center leading-relaxed">
              Al confirmar y enviar las predicciones, ya no podrás modificarlas.<br />
              Antes de confirmar asegúrate de tener todas las predicciones que desees.
            </div>

            <div className="space-y-2 mb-4">
              {predictions.map((pred) => {
                const match = matches.find((m) => m.id === pred.match_id);
                return (
                  <div
                    key={pred.match_id}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.04] text-sm"
                  >
                    <span className="flex items-center gap-1.5 truncate text-[#e8eaf0]">
                      <Flag team={match?.team_local} size={16} />{" "}
                      {match?.team_local}
                    </span>
                    <span className="font-mono font-bold text-accent mx-2">
                      {pred.goals_local}–{pred.goals_visitor}
                    </span>
                    <span className="flex items-center gap-1.5 truncate text-[#e8eaf0]">
                      <Flag team={match?.team_visitor} size={16} />{" "}
                      {match?.team_visitor}
                    </span>
                  </div>
                );
              })}
            </div>
            {error && (
              <div className="flex items-center gap-2 mb-3 bg-red-500/10 rounded-lg px-3 py-2 text-xs text-red-400">
                <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Botones */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 rounded-lg bg-white/10 text-sm text-[#e8eaf0] font-semibold hover:bg-white/20 transition-all"
              >
                Modificar predicciones
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-lg bg-accent text-white font-semibold text-sm hover:bg-accent/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{" "}
                    Enviando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" /> Enviar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
