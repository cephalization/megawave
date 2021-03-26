import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import 'tailwindcss/tailwind.css';

import App from './App.jsx';
import './index.css';
import { mobileResizer } from './mobileResizer.js';
import store from './store/store.js';

mobileResizer();

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
  document.getElementById('root'),
);

// Hot Module Replacement (HMR) - Remove this snippet to remove HMR.
// Learn more: https://www.snowpack.dev/#hot-module-replacement
if (import.meta.hot) {
  import.meta.hot.accept();
}
