import React from 'react';
import { signOut } from 'firebase/auth'; // La fonction signOut standard
import { auth } from '../firebase'; // L'instance d'authentification

const LogoutButton = () => {
    const handleLogout = async () => {
        try {
            await signOut(auth);
            alert('Déconnexion réussie.');
            // Ici, vous pouvez rediriger l'utilisateur vers la page de connexion
        } catch (error) {
            console.error('Erreur de déconnexion:', error);
        }
    };

    return <button onClick={handleLogout}>Déconnexion</button>;
};

export default LogoutButton;
