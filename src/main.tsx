import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

async function bootstrap() {
  const root = document.getElementById('root')
  if (!root) throw new Error('Root element #root not found')

  const mod =
    import.meta.env.VITE_APP_SURFACE === 'ops'
      ? await import('./OpsRoot')
      : await import('./CustomerRoot')

  createRoot(root).render(
    <StrictMode>
      <mod.default />
    </StrictMode>,
  )
}

void bootstrap()
