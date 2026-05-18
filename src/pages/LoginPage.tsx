import { useState } from "react";
import { useStore } from "../store";
import { webApi } from "../api";

export default function LoginPage() {
  const { campaign, setScreen, setEmployee, setCampaign, setPhaseData } = useStore();
  const [code, setCode] = useState("");
  const [nombres, setNombres] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError("");

    try {
      const extra = showForm ? { nombres, email, telefono } : {};
      const result = await webApi.login(code.trim(), campaign!.id, extra);
      sessionStorage.setItem("web_token", result.access_token);
      sessionStorage.setItem("web_employee", JSON.stringify(result.employee));
      sessionStorage.setItem("web_campaign", JSON.stringify(campaign));
      setEmployee(result.employee);

      const phaseData = await webApi.getPhase()
      setPhaseData(phaseData.phase, phaseData.matches)
      setScreen(phaseData.phase && phaseData.already_submitted ? 'done' : 'predict')
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#1a2332]/90 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-2xl">
      <h1 className="text-2xl font-bold text-center mb-6">Ingresa tu código</h1>
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
          disabled={loading || !code.trim()}
          className="w-full py-3 rounded-lg bg-accent text-white font-semibold text-base
                     hover:bg-accent/90 active:scale-[0.98] transition-all
                     disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </div>
  );
}
