import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useRoute } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Landing from "./pages/Landing";
import SharedAnalysis from "./pages/SharedAnalysis";

type QueryMode = "text" | "vision";

function GeoQueryEntry() {
  const [mode, setMode] = useState<QueryMode | null>(null);
  return mode ? <Home initialMode={mode} onBack={() => setMode(null)} /> : <Landing onEnter={setMode} />;
}

function WorkspaceRoute() {
  return <Home initialMode="vision" onBack={() => { window.location.href = "/"; }} />;
}

function ResultPreviewRoute() {
  return <Home initialMode="vision" onBack={() => { window.location.href = "/workspace"; }} initialResult={{ imageUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 760'%3E%3Crect width='1200' height='760' fill='%231d5860'/%3E%3Cpath d='M0 570 190 440 330 500 510 290 690 410 900 170 1200 330V760H0Z' fill='%23051824'/%3E%3Cpath d='M0 570 190 440 330 500 510 290 690 410 900 170 1200 330' fill='none' stroke='%23f0a36b' stroke-width='5'/%3E%3C/svg%3E", answer: "The preview scene contains a compact settlement core aligned with a strong access corridor.", confidence: 0.92, source: "Preview", mode: "Vision Query", regions: [{ label: "Settlement core", bbox: [0.25, 0.28, 0.62, 0.62] }, { label: "Access corridor", bbox: [0.08, 0.62, 0.73, 0.78] }] }} />;
}

function SharedAnalysisRoute() {
  const [, params] = useRoute("/share/:token");
  return <SharedAnalysis token={params?.token ?? ""} />;
}

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={GeoQueryEntry} />
      <Route path={"/workspace"} component={WorkspaceRoute} />
      <Route path={"/workspace/result-preview"} component={ResultPreviewRoute} />
      <Route path={"/share/:token"} component={SharedAnalysisRoute} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
