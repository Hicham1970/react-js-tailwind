import React from "react";
import { useAlert, useUser } from "../hooks/Hooks";
import { Link, useNavigate } from "react-router-dom";

function Profile({ username, email, password }) {
  const { dispatchAlert } = useAlert();
  const { logout } = useUser();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout(); // utilise le logout centralisé du contexte
      dispatchAlert({ type: "SHOW", payload: "Vous avez été déconnecté.", variant: "Danger" });
      navigate("/login");
    } catch (err) {
      console.error("Erreur lors de la déconnexion depuis Profile:", err);
      dispatchAlert({ type: "SHOW", payload: "Erreur lors de la déconnexion.", variant: "Danger" });
    }
  };

  return (
    <div className="space-y-3 mt-5">
      
      <div className="h-20 w-20 rounded-full bg-gray-500 mx-auto"></div>
      <div className="flex justify-center gap-2 items-center">
        <p className="text-center font-semibold text-xl">{username}</p>{" "}
        <Link to="/profile/edit" className="p-2 bg-gray-300 rounded-lg">Edit</Link>
      </div>
      <p>Email: {email}</p>
      {password}
      <button
        onClick={handleLogout}
        className="w-full bg-red-500 text-white p-2 rounded-lg mt-4"
      >
        Déconnexion
      </button>
      <p className="h-96"></p>
    </div>
  );
}

export default Profile;
