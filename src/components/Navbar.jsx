import React from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useAlert, useUser } from "../hooks/Hooks";
import { useTheme } from "../context/ThemeContext";
import { SunIcon, MoonIcon } from "@heroicons/react/24/solid";

function Navbar() {
  const { id } = useParams();
  const { dispatchAlert } = useAlert();
  const { user, logout } = useUser();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

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
    <div className="fixed top-0 left-0 right-0 h-16 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex justify-between items-center px-4 sm:px-6 md:px-10 py-5 z-50 border-b border-slate-200 dark:border-slate-800">
      <Link to="/" className="flex items-center gap-2 text-xl font-semibold">
        <img src="/weight.png" alt="Logo" className="h-7 w-7" />
        <span>Sacem</span>
      </Link>
      <div className="flex items-center gap-4">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          {theme === "light" ? (
            <MoonIcon className="w-6 h-6" />
          ) : (
            <SunIcon className="w-6 h-6 text-yellow-400" />
          )}
        </button>
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
