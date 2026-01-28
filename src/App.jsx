import React, { useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Alert from './components/Alert';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import OnHire from './pages/Onhire';
import Edit from './pages/Edit';
import User from './pages/User';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Notfound from './pages/Notfound';
import { useAuth } from './context/AuthContext';

function App() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser && window.location.pathname === '/') {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  return (
    <>
      <Navbar />
      <Alert />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/onhire" element={<OnHire />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/users/:username/edit" element={<Edit />} />
        <Route path="/users/:username" element={<User />} />
        <Route path="/users" element={<Users />} />
        <Route path="*" element={<Notfound />} />
      </Routes>
    </>
  );
}

export default App;
