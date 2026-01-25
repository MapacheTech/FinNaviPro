import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const mount = () => {
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    // Retry in 10ms if root is missing (should not happen if HTML is correct, but safe for WebView)
    setTimeout(mount, 10);
    return;
  }

  // Prevent double mounting
  if (rootElement.hasAttribute('data-mounted')) return;
  rootElement.setAttribute('data-mounted', 'true');

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

// Try to mount immediately, then on load, then on recurring interval just in case
mount();
window.addEventListener('load', mount);
document.addEventListener('DOMContentLoaded', mount);