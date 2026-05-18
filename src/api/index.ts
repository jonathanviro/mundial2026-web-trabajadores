import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || '/api'

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
})

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('web_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && err.config?.headers?.Authorization) {
      sessionStorage.removeItem('web_token')
      sessionStorage.removeItem('web_employee')
      sessionStorage.removeItem('web_campaign')
      window.location.href = '/'
    }
    return Promise.reject(err)
  },
)

export const webApi = {
  campaignByDomain: (domain: string, slug?: string) =>
    api.post('/web/campaign-by-domain', { domain, slug }).then((r) => r.data),

  login: (code: string, campaign_id: number, extra?: { nombres?: string; apellidos?: string; email?: string; telefono?: string }) =>
    api.post('/web/login', { code, campaign_id, ...extra }).then((r) => r.data),

  getPhase: () =>
    api.get('/web/phase').then((r) => r.data),

  submitPredictions: (data: { predictions: { match_id: number; goals_local: number; goals_visitor: number }[]; champion_team?: string }) =>
    api.post('/web/predict', data).then((r) => r.data),

  myPredictions: () =>
    api.get('/web/my-predictions').then((r) => r.data),

  log: (action: string, metadata?: any) =>
    api.post('/web/log', { action, metadata }).catch(() => {}),
}
