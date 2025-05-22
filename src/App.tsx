import React from "react";
import { Route, Switch } from "wouter";
import { ProjectListPage } from "./pages/ProjectListPage";
import { ProjectPage } from "./pages/ProjectPage";
import { Navbar } from "@/components/Navbar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ImagePage } from "@/pages/ImagePage";

export const App = () => {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="flex h-screen flex-col">
        <Navbar />

        <main className="flex-1 overflow-y-auto">
          <Switch>
            <Route path="/" component={ProjectListPage} />
            <Route path="/project/:id" component={ProjectPage} />
            <Route path="/project/:id/image/:index" component={ImagePage} />
          </Switch>
        </main>
      </div>
    </ThemeProvider>
  );
};
