import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register service worker with auto-update to ensure offline caching of app shell & static assets
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('[ServiceWorker] New content available, auto-updating...');
  },
  onOfflineReady() {
    console.log('[ServiceWorker] App ready to work offline. All records viewable when connection lost.');
  },
  onRegisterError(error) {
    console.warn('[ServiceWorker] Registration error:', error);
  },
});

createRoot(document.getElementById('root')!).render(<App />);
