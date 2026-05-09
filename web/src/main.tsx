import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { useAuthStore } from './store/useAuthStore'

// Hydrate auth state on startup (non-blocking)
try {
  useAuthStore.getState().hydrate();
} catch (e) {
  // ignore hydration errors
  // console.warn('Auth hydrate failed', e);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
