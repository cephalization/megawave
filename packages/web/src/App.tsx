import React from 'react';
import { Route, BrowserRouter as Router, Switch } from 'react-router-dom';

import { Home } from '~/components/views/Home';

function App() {
  return (
    <Router>
      <Switch>
        <Route exact path="/">
          <Home />
        </Route>
        <Route path="/login">{null}</Route>
        {/* <PrivateRoute path="/library">
          <ProtectedPage />
        </PrivateRoute> */}
      </Switch>
    </Router>
  );
}

export default App;
