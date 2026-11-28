import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import { AppStateProvider } from "./state/AppState.tsx";
import { AuthProvider } from "./state/AuthState.tsx";
import { fetchApprovedLibrary } from "./lib/cloud.ts";
import { registerRecipes } from "./lib/libraryRecipes.ts";
import "./index.css";

const CACHE_KEY = "tinythali.library.v1";

/** Approved recipes join the menu before the first screen. Slow or offline: use the last copy, never block the app. */
async function loadLibrary(): Promise<void> {
  try {
    const rows = await Promise.race([
      fetchApprovedLibrary(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("slow")), 2500)),
    ]);
    registerRecipes(rows);
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(rows)); } catch { /* storage may be blocked */ }
  } catch {
    try { registerRecipes(JSON.parse(localStorage.getItem(CACHE_KEY) ?? "[]")); } catch { /* ignore */ }
  }
}


void loadLibrary().then(() => createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppStateProvider>
          <App />
        </AppStateProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
));
