import React from "react";
import { Router, Route, Switch } from "wouter";
import { ProjectListPage } from "./pages/ProjectListPage";
import { ProjectPage } from "./pages/ProjectPage";

export const App = () => {
  return (
    <Switch>
      <Route path="/" component={ProjectListPage} />
      <Route path="/project/:id" component={ProjectPage} />
      <Route>404 – Not Found</Route>
    </Switch>
  );
};
