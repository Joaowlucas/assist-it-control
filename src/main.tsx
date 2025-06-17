
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Redirecionar para landing page se não estiver logado
const shouldShowLanding = () => {
  const path = window.location.pathname
  return path === '/' && !localStorage.getItem('supabase.auth.token')
}

if (shouldShowLanding()) {
  window.history.replaceState(null, '', '/landing')
}

createRoot(document.getElementById("root")!).render(<App />);
