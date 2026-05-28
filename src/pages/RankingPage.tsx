import { useEffect } from "react";
import { useStore } from "../store";
import { webApi } from "../api";

export default function RankingPage() {
  const { ranking, setRanking, setScreen } = useStore();

  useEffect(() => {
    webApi.getRanking().then((res) => {
      setRanking(res.ranking || []);
    }).catch(() => {});
  }, []);

  return (
    <div className="h-full flex flex-col">
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

      <div className="flex-1 overflow-y-auto p-4 md:px-8">
        {ranking.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[#7a8899]">No hay ranking disponible aún</p>
            <p className="text-xs text-[#4a5568] mt-2">Las predicciones deben estar habilitadas</p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-2">
            {ranking.map((entry) => (
              <div
                key={entry.code}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  entry.position <= 3
                    ? "bg-accent/10 border-accent/30"
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
                  {entry.position}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#e8eaf0] truncate">
                    {entry.nombres}
                  </p>
                  <p className="text-xs text-[#7a8899] font-mono">{entry.code}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-lg font-bold text-accent">{entry.total_points}</p>
                  <p className="text-[10px] text-[#7a8899] uppercase tracking-wider">Pts</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
