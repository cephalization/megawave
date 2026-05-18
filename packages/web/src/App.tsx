import { BrowserRouter, Route, Routes } from 'react-router';

import { AuthGate } from '~/components/auth/AuthGate';
import { Admin } from '~/components/views/Admin';
import { Home } from '~/components/views/Home';
import { Login } from '~/components/views/Login';

// const router = createBrowserRouter([
//   {
//     path: '/',
//     element: <Home />,
//   },
//   {
//     path: '/login',
//     element: <Login />,
//   },
//   {
//     path: '/playlists',
//     element: <Home />, // TODO: Create Playlists component
//   },
//   {
//     path: '/recent',
//     element: <Home />, // TODO: Create Recent component
//   },
// ]);

// function App() {
//   return <RouterProvider router={router} />;
// }

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <AuthGate>
              <Home />
            </AuthGate>
          }
        />
        <Route
          path="/admin"
          element={
            <AuthGate>
              <Admin />
            </AuthGate>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
