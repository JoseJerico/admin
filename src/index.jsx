import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(new URL('./sw.js', import.meta.url)).catch(err => {
      console.log('ServiceWorker registration failed:', err)
    })
  })
}

createRoot(document.getElementById('root')).render(<App />)
