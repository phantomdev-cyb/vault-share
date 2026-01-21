import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// 1. Safety Check: Verify HTML structure exists
const rootElement = document.getElementById('root');

if (!rootElement) {
  // If the <div> is missing, print a visible error to the screen
  document.body.innerHTML = '<h1 style="color:red">FATAL ERROR: id="root" missing in index.html</h1>';
  throw new Error('FATAL: Missing root element');
}

// 2. Mount the Application
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)