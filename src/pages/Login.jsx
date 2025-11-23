import { useState, useContext } from "react";
import { UserContext } from "../context/UserContext";
import { AlertContext } from "../context/AlertContext";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../firebase"; // Importer l'auth de Firebase
import { signInWithEmailAndPassword } from "firebase/auth";

function Login() {
  const { dispatchUser } = useContext(UserContext);
  const { dispatchAlert } = useContext(AlertContext);
  const navigate = useNavigate();

  const [userDetails, setUserDetails] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      dispatchUser({ type: "LOADING" }); // Indiquer le chargement

      // Utilisation de Firebase pour la connexion
      const userCredential = await signInWithEmailAndPassword(
        auth,
        userDetails.email,
        userDetails.password
      );

      // Mettre à jour le contexte utilisateur
      dispatchUser({ type: "LOG_IN", payload: userCredential.user });
      dispatchUser({ type: "SUCCESS" }); // Clear loading
      
      dispatchAlert({
        type: "SHOW",
        payload: "Log in successful",
        variant: "Success",
      });

      navigate("/dashboard"); // Redirect after login
      
    } catch (err) {
      dispatchAlert({
        type: "SHOW",
        payload: err.message,
        variant: "Warning",
      });
      dispatchUser({ type: "ERROR" }); // Clear loading and set error
      console.error(err);
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
    <div className="flex justify-center">
      <div className="mt-20">
        <h1 className="font-bold text-3xl mb-5">Log in</h1>
        <p className="mb-8">Enter your details below to log in</p>
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
            Log in
          </button>
        </form>
        <p className="mt-5">
          Or <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
