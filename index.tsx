import React from 'react';
import ReactDOM from 'react-dom/client';
import AppRoot from './App';
import './index.css';
import { initErrorTracking } from './utils/errorTracking';

// Initialize error tracking
initErrorTracking();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement!);
root.render(
  <React.StrictMode>
    <AppRoot />
  </React.StrictMode>
);