import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import WorkingApp from './WorkingApp.jsx'

// Switch to WorkingApp - the fully functional version
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <WorkingApp />
  </StrictMode>,
)
