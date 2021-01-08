import React from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Route, BrowserRouter as Router, Switch } from 'react-router-dom';

import { Home } from '~/components/views/Home';
import { Login } from './components/views/Login';

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false } },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Switch>
          <Route exact path="/">
            <Home />
          </Route>
          <Route path="/login">
            <Login />
          </Route>
          {/* <PrivateRoute path="/library">
          <ProtectedPage />
        </PrivateRoute> */}
        </Switch>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
