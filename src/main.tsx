import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles.css'
import { AuthProvider } from './context/AuthContext'
import { DocumentViewerProvider } from './context/DocumentViewerContext'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AuthProvider>
      <DocumentViewerProvider>
        <App />
      </DocumentViewerProvider>
    </AuthProvider>
  </React.StrictMode>,
)
