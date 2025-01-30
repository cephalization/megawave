import React from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router';

import { Home } from '~/components/views/Home';

import { Login } from './components/views/Login';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/playlists',
    element: <Home />, // TODO: Create Playlists component
  },
  {
    path: '/recent',
    element: <Home />, // TODO: Create Recent component
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
