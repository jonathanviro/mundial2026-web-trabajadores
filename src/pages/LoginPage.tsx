import { useState } from "react";
import { useStore } from "../store";
import { webApi } from "../api";

export default function LoginPage() {
  const { campaign, setScreen, setEmployee, setCampaign, setPhaseData } =
    useStore();
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [nombres, setNombres] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [instructions, setInstructions] = useState<string[]>([]);
  const [showInstructions, setShowInstructions] = useState(false);
  const [autoOpened, setAutoOpened] = useState(false);

  useState(() => {
    webApi
      .getInstructions()
      .then((res) => {
        setInstructions(res.instructions);
        setShowInstructions(true);
        setAutoOpened(true);
      })
      .catch(() => {});
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !password.trim()) return;
    setLoading(true);
    setError("");

    try {
      const extra = showForm ? { nombres, email, telefono } : {};
      const result = await webApi.login(
        code.trim(),
        password.trim(),
        campaign!.id,
        extra,
      );
      sessionStorage.setItem("web_token", result.access_token);
      sessionStorage.setItem("web_employee", JSON.stringify(result.employee));
      sessionStorage.setItem("web_campaign", JSON.stringify(campaign));
      setEmployee(result.employee);

      const phaseData = await webApi.getPhase();
      setPhaseData(
        phaseData.phase,
        phaseData.matches,
        phaseData.prediction_date,
        phaseData.all_matches,
      );
      setScreen("dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Formulario */}
      <div className="bg-[#1a2332]/90 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-2xl">
        <h1 className="text-2xl font-bold text-center mb-6">
          Ingresa tu código
        </h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Código de trabajador"
            className="w-full px-4 py-3 rounded-lg bg-[#0f1923] border border-white/10 text-center text-xl font-mono
                       text-[#e8eaf0] placeholder-[#4a5568] outline-none focus:border-accent/60 transition-colors"
            autoFocus
            disabled={loading}
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            className="w-full px-4 py-3 rounded-lg bg-[#0f1923] border border-white/10 text-center text-xl
                       text-[#e8eaf0] placeholder-[#4a5568] outline-none focus:border-accent/60 transition-colors"
            disabled={loading}
          />

          {!campaign?.control_employees && !showForm && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="text-xs text-[#7a8899] hover:text-accent transition-colors"
            >
              + Completar datos (opcional)
            </button>
          )}

          {showForm && (
            <div className="space-y-3 animate-fade-in">
              <input
                type="text"
                value={nombres}
                onChange={(e) => setNombres(e.target.value)}
                placeholder="Nombre y apellido"
                className="w-full px-4 py-2.5 rounded-lg bg-[#0f1923] border border-white/10 text-sm
                           text-[#e8eaf0] placeholder-[#4a5568] outline-none focus:border-accent/60"
                disabled={loading}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full px-4 py-2.5 rounded-lg bg-[#0f1923] border border-white/10 text-sm
                           text-[#e8eaf0] placeholder-[#4a5568] outline-none focus:border-accent/60"
                disabled={loading}
              />
              <input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Teléfono"
                className="w-full px-4 py-2.5 rounded-lg bg-[#0f1923] border border-white/10 text-sm
                           text-[#e8eaf0] placeholder-[#4a5568] outline-none focus:border-accent/60"
                disabled={loading}
              />
            </div>
          )}

          {error && (
            <p className="text-sm text-red-400 text-center bg-red-500/10 rounded-lg px-4 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !code.trim() || !password.trim()}
            className="w-full py-3 rounded-lg bg-accent text-white font-semibold text-base
                       hover:bg-accent/90 active:scale-[0.98] transition-all
                       disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>

          <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 text-center leading-relaxed">
            La contraseña es de uso personal e intransferible. El manejo y
            custodia de tu contraseña es tu completa responsabilidad.
          </div>
        </form>
      </div>

      {/* Botón instrucciones */}
      <button
        type="button"
        onClick={() => setShowInstructions(!showInstructions)}
        className="w-full py-2.5 rounded-lg bg-white/[0.06] border border-white/10 text-sm text-[#b0b8c8]
                   hover:text-accent hover:border-accent/30 transition-all flex items-center justify-center gap-2"
      >
        📖 {showInstructions ? "Cerrar instrucciones" : "Ver instrucciones del juego"}
      </button>

      {/* Modal instrucciones */}
      {showInstructions && instructions.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <div
            className="w-full max-w-lg bg-[#1a2332] rounded-2xl border border-white/10 p-6 animate-fade-in shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4">
              <h2 className="text-lg font-bold text-accent text-center">Instrucciones</h2>
            </div>
            <ul className="space-y-2 mb-5">
              {instructions.map((text, i) => (
                <li key={i} className="text-sm text-[#b0b8c8] flex gap-2">
                  <span className="text-accent shrink-0 mt-0.5">•</span>
                  <span>{text}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => setShowInstructions(false)}
              className="w-full py-2.5 rounded-lg bg-accent text-white font-semibold text-sm hover:bg-accent/90 active:scale-[0.98] transition-all"
            >
              Comprendo las Instrucciones
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
