import { StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

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
