import { StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Rooms are downloaded as they're needed. If the site was redeployed since
// this page loaded, the old room files are gone: reload to get the new ones
// (a multiplayer game rejoins by itself). Once a minute at most, so a real
// outage can't loop.
window.addEventListener('vite:preloadError', (e) => {
  try {
    const last = Number(sessionStorage.getItem('deja:reloadedAt') ?? 0)
    if (Date.now() - last < 60_000) return
    sessionStorage.setItem('deja:reloadedAt', String(Date.now()))
  } catch {
    return
  }
  e.preventDefault()
  window.location.reload()
})

async function boot() {
  const params = new URLSearchParams(window.location.search)
  let root: ReactNode = <App />
  // Dev-only layout photo mode, compiled out of production builds.
  if (import.meta.env.DEV && params.has('shot')) {
    const { PhotoBooth } = await import('./dev/PhotoBooth')
    root = <PhotoBooth params={params} />
  }
  createRoot(document.getElementById('root')!).render(<StrictMode>{root}</StrictMode>)
}

void boot()
