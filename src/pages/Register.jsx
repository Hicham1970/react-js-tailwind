import { useState, useContext, useEffect } from "react";
import { UserContext } from "../context/UserContext";
import { AlertContext } from "../context/AlertContext";
import { useUser } from "../hooks/Hooks";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../firebase"; // Importer l'auth de Firebase
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";

function Register() {
  const { dispatchUser } = useContext(UserContext);
  const { dispatchAlert } = useContext(AlertContext);
  const navigate = useNavigate();

  const { user } = useUser();

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // Removed redirect logic to allow access to register page.
    console.log("Register.jsx useEffect - user:", user);
    console.log("Register.jsx useEffect - auth.currentUser:", auth.currentUser);
  }, [user]);
  

  const [userDetails, setUserDetails] = useState({
    username: "",
    email: "",
    password: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatchUser({ type: "LOADING" });

    try {
      // 1. Créer l'utilisateur avec email et mot de passe
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userDetails.email,
        userDetails.password
      );

      // 2. Mettre à jour le profil pour ajouter le nom d'utilisateur (displayName)
      await updateProfile(userCredential.user, {
        displayName: userDetails.username,
      });

      // 3. Mettre à jour notre contexte utilisateur
      dispatchUser({ type: "LOG_IN", payload: userCredential.user });
      
      dispatchAlert({
        type: "SHOW",
        payload: "Registration successful!",
        variant: "Success",
      });
      // La redirection est gérée par le useEffect
      } catch (err) {
        console.error("Registration error:", err);
        dispatchAlert({
          type: "SHOW",
          payload: `Registration failed: ${err.message}`,
          variant: "Warning",
        });
        dispatchUser({ type: "ERROR" });
      }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setUserDetails((prevState) => {
      return {
        ...prevState,
        [name]: value,
      };
    });
  };

  return (
    <div className="flex justify-center px-4">
      <div className="mt-20">
        <h1 className="font-bold text-3xl mb-5">Register</h1>
        <p className="mb-8">Let's get you started</p>
        <form className="space-y-3" onSubmit={handleSubmit}>
          <input
            className="block py-2 px-5 rounded-lg border-2 border-slate-400 focus:border-purple-700 outline-none transition-all duration-200"
            type="email"
            name="email"
            placeholder="Email address"
            value={userDetails.email}
            onChange={handleChange}
          />
          <input
            className="block py-2 px-5 rounded-lg border-2 border-slate-400 focus:border-purple-700 outline-none transition-all duration-200"
            type="text"
            name="username"
            placeholder="Username"
            value={userDetails.username}
            onChange={handleChange}
          />
          <input
            className="block py-2 px-5 rounded-lg border-2 border-slate-400 focus:border-purple-700 outline-none transition-all duration-200"
            type="password"
            name="password"
            placeholder="Password"
            value={userDetails.password}
            onChange={handleChange}
          />
          <button
            className="block w-full bg-purple-700 text-white font-medium text-lg py-2 px-5 rounded-3xl"
            type="submit"
          >
            Register
          </button>
        </form>
        <p className="mt-5">Or <Link to="/login">Login</Link></p>
      </div>
    </div>
  );
}

export default Register;
