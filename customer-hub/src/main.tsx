import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  // <StrictMode>
    <BrowserRouter 
        basename={import.meta.env.MODE === 'production' 
        || import.meta.env.MODE === 'prod-local'
        || import.meta.env.MODE === 'dev-staging'  ? '/customer-hub' : '/'}>
      <App />
    </BrowserRouter>
  // </StrictMode>,
)
