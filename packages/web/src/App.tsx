import { BrowserRouter, Route, Routes } from 'react-router';

import { PlayerLayout } from '~/components/templates/PlayerLayout/PlayerLayout';
import { Home } from '~/components/views/Home';
import { Recent } from '~/components/views/Recent';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PlayerLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/recent" element={<Recent />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
