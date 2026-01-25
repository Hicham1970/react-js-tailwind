import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import UserProvider from './context/UserContext'
import AlertProvider from './context/AlertContext' // Assurez-vous que ce fichier existe aussi
import { AuthProvider } from './context/AuthContext.jsx'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <UserProvider>
        <AlertProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </AlertProvider>
      </UserProvider>
    </AuthProvider>
  </React.StrictMode>,
)