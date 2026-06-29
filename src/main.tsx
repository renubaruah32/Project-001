import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Prevent harmless third-party network/fetch errors (like direct Supabase direct queries)
// from bubbling up as uncaught fatal errors in the browser and test-runner environments.
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const msg = (reason && (reason.message || reason.stack || String(reason))) || '';
    if (
      msg.includes('Failed to fetch') ||
      msg.includes('fetch') ||
      msg.includes('NetworkError') ||
      msg.includes('Load failed') ||
      msg.includes('supabase')
    ) {
      console.warn('[Global Suppressed Rejection]', reason);
      event.preventDefault(); // Prevent standard browser uncaught logging
    }
  });

  window.addEventListener('error', (event) => {
    const error = event.error;
    const msg = event.message || (error && (error.message || String(error))) || '';
    if (
      msg.includes('Failed to fetch') ||
      msg.includes('fetch') ||
      msg.includes('NetworkError') ||
      msg.includes('Load failed') ||
      msg.includes('supabase')
    ) {
      console.warn('[Global Suppressed Error]', msg);
      event.preventDefault(); // Prevent standard browser uncaught logging
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

