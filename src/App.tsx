import React from "react";
import { Route, Router, Switch } from "wouter";
import { ProjectListPage } from "./pages/ProjectListPage";
import { ProjectPage } from "./pages/ProjectPage";
import { Navbar } from "@/components/Navbar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ImagePage } from "@/pages/ImagePage";
import { Toaster } from "@/components/ui/sonner";
import { useHashLocation } from "wouter/use-hash-location";

export const App = () => {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Router hook={useHashLocation}>
        <div className="flex h-screen flex-col">
          <Navbar />
          <main className="w-full flex-1 overflow-y-auto">
            <Switch>
              <Route path="/" component={ProjectListPage} />
              <Route path="/project/:id" component={ProjectPage} />
              <Route path="/project/:id/image/:index" component={ImagePage} />
            </Switch>
          </main>
        </div>
        <Toaster />
      </Router>
    </ThemeProvider>
  );
};
