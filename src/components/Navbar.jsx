import React from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useAlert, useUser } from "../hooks/Hooks";

function Navbar() {
  const { id } = useParams();
  const { dispatchAlert } = useAlert();
  const { user, logout } = useUser();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      dispatchAlert({
        type: "SHOW",
        payload: "Vous avez été déconnecté.",
        variant: "Danger",
      });
      navigate("/login");
    } catch (err) {
      console.error("Erreur logout Navbar:", err);
      dispatchAlert({ type: "SHOW", payload: "Erreur lors de la déconnexion.", variant: "Danger" });
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 h-16 w-full bg-white bg-opacity-90 flex justify-between items-center px-10 py-5 z-50">
      <Link to="/" className="text-xl font-semibold">
        Sacem
      </Link>
      <div className="flex gap-2">
        <Link
          to="/users"
          className=" right-10 grid place-content-center bg-blue-700 text-white font-medium text-lg px-5 h-10 w-28 rounded-3xl"
        >
          Admin
        </Link>
        {user && (
          <button
            onClick={handleLogout}
            className=" right-10 bg-red-700 text-white font-medium text-lg px-5 h-10 w-28 rounded-3xl"
            type="submit"
          >
            Log out
          </button>
        )}
      </div>
    </div>
  );
}

export default Navbar;
