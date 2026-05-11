import React from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './index.css';
import './styles/custom-tables.css';
import './styles/theme-tint.css';
import App from './App';
import { installMockFetch } from './mocks/mockServer';

// Install mock fetch interceptor for raw fetch() calls (DigiLocker, etc.)
installMockFetch();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <App />
);
