import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  (window as any).deferredPrompt = e;
  window.dispatchEvent(new CustomEvent("pwa-install-available"));
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

if ("serviceWorker" in navigator) {
  sessionStorage.removeItem("birrtu-sw-refreshing");

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        console.log("Service Worker registered successfully:", reg.scope);
        void reg.update();
      })
      .catch((err) => console.error("Service Worker registration failed:", err));
  });

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (sessionStorage.getItem("birrtu-sw-refreshing")) return;
    sessionStorage.setItem("birrtu-sw-refreshing", "1");
    window.location.reload();
  });
}
