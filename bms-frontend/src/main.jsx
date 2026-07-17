import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import {BrowserRouter as Router} from 'react-router-dom'
import { LocationProvide } from './context/LocationContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router>
      <LocationProvide>
        <App />
      </LocationProvide>
    </Router>
  </StrictMode>,
)
