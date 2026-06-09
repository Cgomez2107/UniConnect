import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { useAuthStore } from './store/useAuthStore'
import { useSpamStore } from './store/useSpamStore'
import { validateWebEnv, formatValidationErrors } from '@uniconnect/shared-utils/envValidator'

// Validate critical env vars at startup
const envResult = validateWebEnv(typeof import.meta !== 'undefined' ? import.meta.env : {}, {
  isDev: typeof import.meta !== 'undefined' ? import.meta.env.DEV : true,
});

if (!envResult.valid) {
  const rootEl = document.getElementById('root');
  if (rootEl) {
    const details = formatValidationErrors(envResult);
    createRoot(rootEl).render(
      <div style={{
        padding: '2rem',
        maxWidth: '640px',
        margin: '4rem auto',
        fontFamily: 'system-ui, sans-serif',
        color: '#b91c1c',
        backgroundColor: '#fef2f2',
        border: '1px solid #fca5a5',
        borderRadius: '8px',
      }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem' }}>
          Configuración incompleta
        </h1>
        <pre style={{
          whiteSpace: 'pre-wrap',
          fontSize: '0.875rem',
          lineHeight: 1.6,
          color: '#1e293b',
        }}>{details}</pre>
        <p style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#64748b' }}>
          Crea o actualiza tu archivo <code>web/.env.local</code> basado en <code>.env.example</code> y reinicia el servidor.
        </p>
      </div>
    );
  }
} else {
  // Hydrate auth state on startup (non-blocking)
  try {
    useAuthStore.getState().hydrate();
  } catch (e) {
    // ignore hydration errors
  }

  // Expose spam store for E2E tests
  if (typeof window !== 'undefined') {
    (window as any).__ZUSTAND_STORE__ = useSpamStore;
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
