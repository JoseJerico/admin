import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

const root = document.getElementById('root')

createRoot(root).render(<App />)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(
      new URL('./sw.js', import.meta.url)
    ).catch((err) => {
      console.log('ServiceWorker registration failed:', err)
    })
  })
}