import React from 'react';
import ReactDOM from 'react-dom';
import App from './App.jsx';
import './index.css';
import 'tailwindcss/tailwind.css';
import { mobileResizer } from './mobileResizer.js';

mobileResizer();

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root'),
);

// Hot Module Replacement (HMR) - Remove this snippet to remove HMR.
// Learn more: https://www.snowpack.dev/#hot-module-replacement
if (import.meta.hot) {
  import.meta.hot.accept();
}
