import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Handle known benign Firebase Auth internal assertion in sandboxed iframes
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reasonStr = String(event?.reason?.message || event?.reason || '');
    if (
      reasonStr.includes('Pending promise was never set') ||
      reasonStr.includes('popup-closed-by-user') ||
      reasonStr.includes('cancelled-popup-request')
    ) {
      event.preventDefault();
      console.warn('[Firebase Auth Notice] Handled sandboxed popup lifecycle event:', reasonStr);
    }
  });

  window.addEventListener('error', (event) => {
    const msg = String(event?.message || '');
    if (
      msg.includes('Pending promise was never set') ||
      msg.includes('popup-closed-by-user') ||
      msg.includes('cancelled-popup-request')
    ) {
      event.preventDefault();
      return true;
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
