import React from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "../hooks/Hooks";
import Login from "./Login";

export const Home = () => {
  const { user } = useUser();

  // Si l'utilisateur est connecté, redirige vers sacempesage
  if (user) {
    return <Navigate to="/sacempesage" />;
  }

  // Sinon, affiche le formulaire de login
  return <Login />;
};

export default Home;
