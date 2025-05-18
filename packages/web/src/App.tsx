import { makeMegawaveClient } from 'api/client';
import { BrowserRouter, Route, Routes } from 'react-router';

import { Home } from '~/components/views/Home';

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

const client = makeMegawaveClient('http://0.0.0.0:5001');
client.tracks.$get({ query: { limit: '10' } }).then(console.log);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
