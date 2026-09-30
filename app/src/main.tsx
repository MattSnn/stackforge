import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

// Desativa o menu de contexto do navegador fora de campos de texto (sensação de app nativo).
document.addEventListener('contextmenu', (e) => {
  const target = e.target as HTMLElement
  if (!target.closest('input, textarea, pre')) e.preventDefault()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
