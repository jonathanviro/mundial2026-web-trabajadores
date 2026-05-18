import { useEffect, useState } from "react";
import { useStore } from "../store";
import { webApi } from "../api";
import { Flag } from "../components/Flag";
import { LogOut } from "lucide-react";
import type { Registration, Match } from "../types";

export default function DonePage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [phaseName, setPhaseName] = useState("");

  useEffect(() => {
    webApi
      .getPhase()
      .then((data: any) => {
        if (data.phase) {
          setPhaseName(data.phase.name);
        }
      })
      .catch(() => {});

    webApi
      .myPredictions()
      .then((data: any) => {
        setRegistrations(data || []);
      })
      .catch(() => {});
  }, []);

  const handleExit = () => {
    sessionStorage.clear();
    useStore.setState({
      screen: 'login',
      employee: null,
      phase: null,
      matches: [],
      predictions: [],
      champion: null,
      submitting: false,
      error: null,
    });
  };

  const latest = registrations[0];
  if (!latest) return null;

  return (
    <div className="flex flex-col h-screen">
      <div className="bg-black/40 backdrop-blur-md border-b border-white/10 flex-shrink-0">
        <div className="flex items-center justify-end px-4 md:px-8 py-3">
          <button onClick={handleExit}
            className="p-2 text-[#7a8899] hover:text-red-400 transition-colors rounded-lg hover:bg-white/5"
            title="Cerrar sesión">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="flex flex-col items-center py-12 px-4 md:px-8">
          <div className="w-full max-w-2xl mx-auto space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold">
                Ya haz realizado tus predicciones
              </h1>
              <p className="text-lg text-[#7a8899] mt-1">Buena suerte</p>
              {phaseName && (
                <p className="text-sm text-accent mt-1 font-medium">
                  {phaseName}
                </p>
              )}
            </div>

            <div className="space-y-3">
              {latest.predictions.map((p) => {
                const match = p.match as Match;
                return (
                  <div
                    key={p.match_id}
                    className="bg-white/[0.22] backdrop-blur-md rounded-xl px-4 py-3 border border-white/20
                               flex items-center justify-center gap-3"
                  >
                    <Flag team={match?.team_local} size={24} />
                    <span className="text-sm font-bold truncate">
                      {match?.team_local}
                    </span>
                    <span className="text-accent font-bold text-lg flex-shrink-0">
                      {p.goals_local}:{p.goals_visitor}
                    </span>
                    <span className="text-sm font-bold truncate">
                      {match?.team_visitor}
                    </span>
                    <Flag team={match?.team_visitor} size={24} />
                  </div>
                );
              })}
            </div>

            {latest.champion_team && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-center justify-center gap-3">
                <Flag team={latest.champion_team} size={32} />
                <span className="text-lg font-bold text-yellow-500">
                  {latest.champion_team}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
