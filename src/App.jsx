import React, { Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "../src/components/Navbar";
import Alert from "./components/Alert";
import Loader from "./components/Loader";
import { SpeedInsights } from "@vercel/speed-insights/react";
// Importez un futur composant pour les routes protégées
// import ProtectedRoute from "./components/ProtectedRoute"; 

// Chargement asynchrone (Lazy Loading) des pages
const Home = React.lazy(() => import("./pages/Home"));
const Login = React.lazy(() => import("./pages/Login"));
const Register = React.lazy(() => import("./pages/Register"));
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const PesageApp = React.lazy(() => import("./pages/App"));

function App() {
  return (
    <div className="bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 min-h-screen flex flex-col">
      <Router>
        <Navbar />
        <Alert />
        <SpeedInsights />
        <main className="pt-16 flex-grow">
          {/* Suspense permet d'afficher un fallback (ici le Loader) pendant le chargement du composant */}
          <Suspense fallback={<Loader />}>
            <Routes>
              {/* Routes publiques */}
              <Route index element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Exemple de routes protégées */}
              {/* <Route element={<ProtectedRoute />}> */}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/sacempesage" element={<PesageApp />} />
              {/* </Route> */}
            </Routes>
          </Suspense>
        </main>
        <footer className="text-center p-4 text-sm text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800">
          <p>&copy; 2025 - hicham.garoum@sgs.com</p>
        </footer>
      </Router>
    </div>
  );
}

export default App;
