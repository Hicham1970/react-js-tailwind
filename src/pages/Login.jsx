import { useState, useContext, useEffect } from "react";
import { UserContext } from "../context/UserContext";
import { AlertContext } from "../context/AlertContext";
import { useAppState, useUser } from "../hooks/Hooks";
import { Link } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

function Login() {
  const { dispatchUser } = useContext(UserContext);
  const { dispatchAlert } = useContext(AlertContext);

  const { user } = useUser();

  useEffect(() => {
    if (user) {
      window.location.href = "/dashboard";
    }
  }, [user]);

  const [userDetails, setUserDetails] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      dispatchUser({ type: "LOADING" });
      
      // Connexion via Firebase
      const userCredential = await signInWithEmailAndPassword(auth, userDetails.email, userDetails.password);
      const user = userCredential.user;

      setUserDetails({
        email: "",
        password: "",
      });

      dispatchAlert({
        type: "SHOW",
        payload: "Connexion réussie",
        variant: "Success",
      });
      // La redirection sera gérée par le useEffect qui surveille 'user'
    } catch (err) {
      dispatchAlert({
        type: "SHOW",
        payload: err.message,
        variant: "Warning",
      });
      dispatchUser({ type: "ERROR" });
      console.log(err);
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
