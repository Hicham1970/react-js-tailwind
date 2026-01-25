import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from '../firebase';
import { addUser } from '../api/api';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        try {
            // 1. Créer l'utilisateur dans Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 2. Enregistrer les détails supplémentaires dans Realtime Database
            await addUser(user.uid, {
                username: username,
                email: email,
                createdAt: new Date().toISOString()
            });

            alert('Compte créé avec succès !');
            navigate('/dashboard'); // Redirection après succès
        } catch (err) {
            console.error(err);
            setError(err.message);
        }
    };

    return (
        <div className="flex justify-center mt-20 p-10">
            <form onSubmit={handleRegister} className="bg-white p-8 rounded shadow-md w-96">
                <h2 className="text-2xl mb-4 font-bold">Inscription</h2>
                {error && <p className="text-red-500 mb-4">{error}</p>}
                
                <input 
                    type="text" placeholder="Nom d'utilisateur" className="w-full p-2 mb-4 border rounded"
                    value={username} onChange={(e) => setUsername(e.target.value)} required 
                />
                <input 
                    type="email" placeholder="Email" className="w-full p-2 mb-4 border rounded"
                    value={email} onChange={(e) => setEmail(e.target.value)} required 
                />
                <input 
                    type="password" placeholder="Mot de passe" className="w-full p-2 mb-4 border rounded"
                    value={password} onChange={(e) => setPassword(e.target.value)} required 
                />
                <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">S'inscrire</button>
                <p className="mt-4 text-sm">Déjà un compte ? <Link to="/login" className="text-blue-600">Se connecter</Link></p>
            </form>
        </div>
    );
};

export default Register;