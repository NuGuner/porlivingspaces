import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import ProductionEnhancedApp from './ProductionEnhancedApp.jsx'

// Production Enhanced App - CSP-safe version without eval or console logging
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ProductionEnhancedApp />
  </StrictMode>,
)
