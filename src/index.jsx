import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

// Render React app
const container = document.getElementById('root')
const root = createRoot(container)

root.render(<App />)

// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(
      new URL('./sw.js', import.meta.url)
    ).catch((err) => {
      console.log('ServiceWorker registration failed:', err)
    })
  })
}