import React, { useContext } from 'react';
import { signOut } from 'firebase/auth'; // La fonction signOut standard
import { auth } from '../firebase'; // L'instance d'authentification
import { useNavigate } from 'react-router-dom';
import { AlertContext } from '../context/AlertContext';

const LogoutButton = () => {
    const navigate = useNavigate();
    const { dispatchAlert } = useContext(AlertContext);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            dispatchAlert({
                type: "SHOW",
                payload: "Déconnexion réussie",
                variant: "Success",
            });
            navigate('/login'); // Redirection vers la page de connexion
        } catch (error) {
            console.error('Erreur de déconnexion:', error);
        }
    };

    return <button onClick={handleLogout}>Déconnexion</button>;
};

export default LogoutButton;
