import React from "react";
import Show from './Show';
import New from './New';
import RepShow from './RepShow';
import RecNew from './RecNew';
import ShowSpec from './ShowSpec';

import {
  BrowserRouter as Router,
  Switch,
  Route,
} from "react-router-dom";


function App() {
  return (
    <Router>
      <Switch>
        <Route exact path="/new">
          <New />
        </Route>
        <Route exact path="/reports">
          <ShowSpec />
        </Route>
        <Route exact path="/:id/new">
          <RecNew />
        </Route>
        <Route path="/:id">
          <RepShow />
        </Route>
        <Route exact path="/">
          <Show />
        </Route>
      </Switch>
    </Router>
  );
}

export default App;