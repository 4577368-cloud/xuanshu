import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// ==============================
// ✅ PWA Service Worker 注册（安全、无报错）
// ==============================
if ('serviceWorker' in navigator) {
  // 兼容 Vite 和 Create React App 的生产环境检测
  // Fix: Use type assertion to avoid TypeScript error on ImportMeta when using Vite
  const isProduction =
    (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.PROD);

  if (isProduction) {
    window.addEventListener('load', () => {
      // ✅ 确保 Service Worker URL 与当前页面同源（解决跨域错误）
      const swUrl = new URL('/sw.js', window.location.origin).toString();

      navigator.serviceWorker
        .register(swUrl)
        .then((registration) => {
          console.log('✅ PWA Service Worker registered:', registration.scope);
        })
        .catch((error) => {
          console.warn('⚠️ PWA Service Worker registration failed:', error);
        });
    });
  }
}