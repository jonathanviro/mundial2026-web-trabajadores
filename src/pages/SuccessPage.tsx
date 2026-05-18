import { useEffect, useState } from 'react'
import { useStore } from '../store'
import { CheckCircle, Home } from 'lucide-react'

export default function SuccessPage() {
  const [countdown, setCountdown] = useState(10)

  const handleExit = () => {
    sessionStorage.clear()
    useStore.setState({
      screen: 'login',
      employee: null,
      phase: null,
      matches: [],
      predictions: [],
      champion: null,
      submitting: false,
      error: null,
    })
  }

  useEffect(() => {
    if (countdown <= 0) {
      handleExit()
      return
    }
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  return (
    <div className="bg-[#1a2332]/90 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-2xl text-center space-y-6">
      <div className="flex justify-center">
        <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-green-400" />
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-1">¡Predicciones enviadas!</h2>
        <p className="text-sm text-[#7a8899]">
          Tus predicciones han sido registradas exitosamente.
        </p>
      </div>

      <button
        onClick={handleExit}
        className="w-full py-3 rounded-lg bg-accent text-white font-semibold text-base
                   hover:bg-accent/90 active:scale-[0.98] transition-all
                   flex items-center justify-center gap-2"
      >
        <Home className="w-4 h-4" /> Cerrar
      </button>
    </div>
  )
}
