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

function App() {
  return (

    <Router>
      <Navbar />

      <Loader />
      <Alert />
      <div className="pt-16">
        <Routes>
          <Route index element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/sacempesage" element={<PesageApp />} />
        </Routes>
      </div>

    </Router>
  );
}

export default App;
