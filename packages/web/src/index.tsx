import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import 'tailwindcss/tailwind.css';

import App from './App';
import './global.css';
import './index.css';
import { mobileResizer } from './mobileResizer';
import store from './store/store';

mobileResizer();

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
  document.getElementById('root'),
);
