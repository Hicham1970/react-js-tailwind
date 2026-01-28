import React from 'react';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from '../firebase';
import { addUser } from '../api/api';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// Définition du schéma de validation
const registerSchema = z.object({
  username: z.string().min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères"),
  email: z.string().email("Format d'email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

const Register = () => {
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data) => {
        try {
            // 1. Créer l'utilisateur dans Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
            const user = userCredential.user;

            // 2. Enregistrer les détails supplémentaires dans Realtime Database
            await addUser(user.uid, {
                username: data.username,
                email: data.email,
                createdAt: new Date().toISOString()
            });

            alert('Compte créé avec succès !');
            navigate('/dashboard'); // Redirection après succès
        } catch (err) {
            console.error(err);
            setError("root", { message: err.message });
        }
    };

    return (
        <div className="flex justify-center mt-20 p-10">
            <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-8 rounded shadow-md w-96">
                <h2 className="text-2xl mb-4 font-bold">Inscription</h2>
                {errors.root && <p className="text-red-500 mb-4">{errors.root.message}</p>}
                
                <div className="mb-4">
                    <input 
                        type="text" 
                        placeholder="Nom d'utilisateur" 
                        className={`w-full p-2 border rounded ${errors.username ? 'border-red-500' : ''}`}
                        {...register("username")}
                    />
                    {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>}
                </div>

                <div className="mb-4">
                    <input 
                        type="email" 
                        placeholder="Email" 
                        className={`w-full p-2 border rounded ${errors.email ? 'border-red-500' : ''}`}
                        {...register("email")}
                    />
                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
                </div>

                <div className="mb-4">
                    <input 
                        type="password" 
                        placeholder="Mot de passe" 
                        className={`w-full p-2 border rounded ${errors.password ? 'border-red-500' : ''}`}
                        {...register("password")}
                    />
                    {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
                </div>

                <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                    {isSubmitting ? 'Inscription...' : "S'inscrire"}
                </button>
                <p className="mt-4 text-sm">Déjà un compte ? <Link to="/login" className="text-blue-600">Se connecter</Link></p>
            </form>
        </div>
    );
};

export default Register;