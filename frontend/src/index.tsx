import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log('🚀 Starting React app...');

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

console.log('🎯 Root element found, rendering app...');

root.render(<App />);

console.log('✅ App rendered successfully!');
