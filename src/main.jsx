import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import EnhancedApp from './EnhancedApp.jsx'

// Enhanced App with meter history and bill calculation - data exists, fixing display
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <EnhancedApp />
  </StrictMode>,
)
