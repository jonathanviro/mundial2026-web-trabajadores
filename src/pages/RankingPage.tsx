import { useEffect, useState } from "react";
import { useStore } from "../store";
import { webApi } from "../api";

type LimitOption = 10 | 25 | 50 | 100 | 0;

const LIMITS: { label: string; value: LimitOption }[] = [
  { label: "Top 10", value: 10 },
  { label: "Top 25", value: 25 },
  { label: "Top 50", value: 50 },
  { label: "Top 100", value: 100 },
  { label: "Todos", value: 0 },
];

export default function RankingPage() {
  const { ranking, setRanking, setScreen, employee } = useStore();
  const [limit, setLimit] = useState<LimitOption>(10);

  useEffect(() => {
    webApi.getRanking().then((res) => {
      setRanking(res.ranking || []);
    }).catch(() => {});
  }, []);

  const myEntry = ranking.find((r) => r.code === employee?.code);
  const displayed = limit === 0 ? ranking : ranking.slice(0, limit);
  const showMyPosition = myEntry && (limit === 0 || myEntry.position > limit);

  return (
    <div className="h-full flex flex-col bg-[#0f1923]">
      {/* Header */}
      <div className="bg-black/40 backdrop-blur-md border-b border-white/10 flex-shrink-0 px-4 md:px-8 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setScreen("dashboard")}
            className="text-[#7a8899] hover:text-white transition-colors"
          >
            ← Volver
          </button>
          <h1 className="font-bold text-base">Ranking General</h1>
          <div className="w-5" />
        </div>
      </div>

      {/* Limit selector */}
      <div className="flex-shrink-0 px-4 md:px-8 py-3 border-b border-white/10">
        <div className="flex items-center gap-2 max-w-2xl mx-auto">
          <span className="text-xs text-[#7a8899] uppercase tracking-wider font-semibold">Mostrar:</span>
          <div className="flex gap-1">
            {LIMITS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setLimit(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  limit === opt.value
                    ? "bg-accent text-white"
                    : "bg-white/10 text-[#7a8899] hover:text-[#e8eaf0]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {ranking.length > 0 && (
            <span className="text-xs text-[#4a5568] ml-auto">{ranking.length} participantes</span>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 md:px-8">
        {ranking.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[#7a8899]">No hay ranking disponible aún</p>
            <p className="text-xs text-[#4a5568] mt-2">Las predicciones deben estar habilitadas</p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-2">
            {displayed.map((entry) => {
              const isMe = entry.code === employee?.code;
              const medals = ["🥇", "🥈", "🥉"];
              return (
                <div
                  key={entry.code}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                    isMe
                      ? "bg-accent/10 border-accent/30"
                      : entry.position <= 3
                      ? "bg-accent/5 border-accent/20"
                      : "bg-white/10 backdrop-blur-md border-white/10"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    entry.position === 1
                      ? "bg-yellow-500 text-yellow-900"
                      : entry.position === 2
                      ? "bg-gray-300 text-gray-700"
                      : entry.position === 3
                      ? "bg-amber-600 text-amber-100"
                      : "bg-white/10 text-[#7a8899]"
                  }`}>
                    {entry.position <= 3 ? medals[entry.position - 1] : entry.position}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#e8eaf0] truncate">
                      {entry.nombres}
                    </p>
                    <p className="text-xs text-[#7a8899] font-mono">{entry.code}</p>
                  </div>
                  {isMe && (
                    <span className="text-[10px] text-accent font-semibold uppercase tracking-wider mr-1">(tú)</span>
                  )}
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold text-accent">{entry.total_points}</p>
                    <p className="text-[10px] text-[#7a8899] uppercase tracking-wider">Pts</p>
                  </div>
                </div>
              );
            })}

            {/* User position if outside the visible slice */}
            {showMyPosition && myEntry && (
              <div className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-accent/40 bg-accent/5 mt-4">
                <div className="flex items-center gap-2 text-xs text-accent font-semibold uppercase tracking-wider">
                  📍 Tu posición
                </div>
                <div className="flex-1" />
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-accent">#{myEntry.position}</span>
                  <span className="text-sm font-bold text-accent">{myEntry.total_points} pts</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
