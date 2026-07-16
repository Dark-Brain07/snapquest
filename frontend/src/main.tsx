import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PrivyProvider } from '@privy-io/react-auth'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PrivyProvider appId="cmrmthvk300zb0cjuwyeffl72">
      <App />
    </PrivyProvider>
  </StrictMode>,
)
