import { useContext, useEffect } from "react";
import { UserContext } from "../context/UserContext";
import { AlertContext } from "../context/AlertContext";
import { useUser } from "../hooks/Hooks";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

// 1. Importer les bibliothèques nécessaires
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// 2. Définir le schéma de validation avec Zod
const loginSchema = z.object({
  email: z.string().min(1, "L'email est requis").email("Format d'email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

function Login() {
  const { dispatchUser } = useContext(UserContext);
  const { dispatchAlert } = useContext(AlertContext);
  const navigate = useNavigate();

  const { user } = useUser();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  // 3. Initialiser le formulaire avec useForm et le resolver Zod
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  // 4. La fonction onSubmit reçoit directement les données validées
  const onSubmit = async (data) => {
    try {
      dispatchUser({ type: "LOADING" });
      
      // Connexion via Firebase
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

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

  return (
    <div className="flex justify-center">
      <div className="mt-20">
        <h1 className="font-bold text-3xl mb-5">Log in</h1>
        <p className="mb-8">Enter your details below to log in</p>
        {/* 5. Utiliser handleSubmit du hook */}
        <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <input
              className={`block w-full py-2 px-5 rounded-lg border-2 ${errors.email ? 'border-red-500' : 'border-slate-400'} focus:border-purple-700 outline-none transition-all duration-200`}
              type="email"
              placeholder="Email address"
              {...register("email")} // Enregistrement du champ
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <input
              className={`block w-full py-2 px-5 rounded-lg border-2 ${errors.password ? 'border-red-500' : 'border-slate-400'} focus:border-purple-700 outline-none transition-all duration-200`}
              type="password"
              placeholder="Password"
              {...register("password")} // Enregistrement du champ
            />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
          </div>

          <button
            disabled={isSubmitting}
            className="block w-full bg-purple-700 text-white font-medium text-lg py-2 px-5 rounded-3xl disabled:opacity-50"
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
