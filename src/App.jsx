import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import PesageApp from "./pages/App";
import Navbar from "../src/components/Navbar";
import Edit from "./pages/Edit";
import User from "./pages/User";
import ProfilePage from "./pages/ProfilePage";
import AddTestUsers from "./pages/AddTestUsers";
import Alert from "./components/Alert";
import Loader from "./components/Loader";
import { SpeedInsights } from "@vercel/speed-insights/react"

function App() {
  return (

    <div className="bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 min-h-screen flex flex-col">
      <Router>
        <Navbar />
        <Loader />
        <Alert />
        <SpeedInsights />
        <main className="pt-16 flex-grow">
          <Routes>
            <Route index element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/sacempesage" element={<PesageApp />} />
          </Routes>
        </main>
        <footer className="text-center p-4 text-sm text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800">
          <p>&copy; 2025 - hicham.garoum@sgs.com</p>
        </footer>
      </Router>
    </div>
  );
}

export default App;
