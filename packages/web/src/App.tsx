import React from 'react';
import { Route, BrowserRouter, Routes } from 'react-router';

import { Home } from '~/components/views/Home';

import { Login } from './components/views/Login';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" Component={Home} />
        <Route path="/login" Component={Login} />
        {/* <PrivateRoute path="/library">
          <ProtectedPage />
        </PrivateRoute> */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
