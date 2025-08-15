import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import DiagnosticApp from './DiagnosticApp.jsx'

// Diagnostic App to check why no data is showing
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <DiagnosticApp />
  </StrictMode>,
)
