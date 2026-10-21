import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';
import './index.css';

// Clean up any previously registered service workers and caches
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister().catch(() => {});
    }
  }).catch(() => {});
}

createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
);
