import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register Service Worker for PWA (only in production)
// Temporarily disabled during development
// if ('serviceWorker' in navigator && import.meta.env.PROD) {
//   window.addEventListener('load', () => {
//     navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
//       .then((registration) => {
//         registration.update();
//         console.log('SW registered: ', registration);
//       })
//       .catch((registrationError) => {
//         console.log('SW registration failed: ', registrationError);
//       });
//   });
// }

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
