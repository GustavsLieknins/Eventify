// resources/js/app.jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import '../css/app.css';
import './bootstrap';


// Map pages for Vite
const pages = import.meta.glob('./Pages/**/*.jsx');

createInertiaApp({
  resolve: (name) => {
    // name is e.g., 'Auth/Login' or 'Dashboard'
    const page = pages[`./Pages/${name}.jsx`];
    if (!page) throw new Error(`Page not found: ./Pages/${name}.jsx`);
    return page();
  },
  setup({ el, App, props }) {
    createRoot(el).render(<App {...props} />);
  },
});
