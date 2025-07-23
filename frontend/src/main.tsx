import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { setupUltraFastMode } from './utils/ultraFastInit';

// Initialize ultra-fast mode immediately for millisecond loading
setupUltraFastMode().then(() => {
  console.log('🎯 Ultra-Fast Mode Activated! App should load in milliseconds.');
}).catch(console.error);

// Initialize theme on first render
if (typeof window !== 'undefined') {
  const darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (darkMode) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
