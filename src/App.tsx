import { Link, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.tsx";
import { btn, Card } from "./components/ui.tsx";
import Admin from "./pages/Admin.tsx";
import Community from "./pages/Community.tsx";
import Cook from "./pages/Cook.tsx";
import Fridge from "./pages/Fridge.tsx";
import { Guidelines, Privacy, Terms } from "./pages/Legal.tsx";
import Login from "./pages/Login.tsx";
import Profile from "./pages/Profile.tsx";
import RecipePage from "./pages/RecipePage.tsx";
import Results from "./pages/Results.tsx";
import Saved from "./pages/Saved.tsx";
import ShareBoost from "./pages/ShareBoost.tsx";
import Welcome from "./pages/Welcome.tsx";

function NotFound() {
  return (
    <Card className="mt-8 space-y-3 text-center">
      <p className="text-4xl" aria-hidden>🍽️</p>
      <h1 className="text-xl font-extrabold">That page isn't on the menu</h1>
      <Link to="/" className={btn("secondary")}>Back to my fridge</Link>
    </Card>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/welcome" element={<Welcome />} />
      <Route path="/cook/:id" element={<Cook />} />
      <Route element={<Layout />}>
        <Route index element={<Fridge />} />
        <Route path="results" element={<Results />} />
        <Route path="recipe/:id" element={<RecipePage />} />
        <Route path="community" element={<Community />} />
        <Route path="community/share" element={<ShareBoost />} />
        <Route path="saved" element={<Saved />} />
        <Route path="profile" element={<Profile />} />
        <Route path="login" element={<Login />} />
        <Route path="privacy" element={<Privacy />} />
        <Route path="terms" element={<Terms />} />
        <Route path="guidelines" element={<Guidelines />} />
        <Route path="admin" element={<Admin />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
