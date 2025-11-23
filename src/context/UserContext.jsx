import { createContext, useReducer, useEffect } from "react";
import reducer, { initialState } from "../store/userReducer";
import { auth } from "../firebase"; // Importer l'auth de Firebase
import { onAuthStateChanged, signOut } from "firebase/auth";

export const UserContext = createContext(null);

const { Provider } = UserContext;

function UserProvider({ children }) {
  const [state, dispatchUser] = useReducer(reducer, initialState);

  // On mount, clear stale user data from localStorage to avoid premature redirect issues
  // Removed clearing of localStorage user to preserve auth state on reload
  // useEffect(() => {
  //   localStorage.removeItem("user");
  // }, []);

  // Écouter les changements d'état d'authentification de Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // L'utilisateur est connecté
        dispatchUser({ type: "LOG_IN", payload: user });
      } else {
        // L'utilisateur est déconnecté
        dispatchUser({ type: "LOG_OUT" });
      }
    });

    return () => unsubscribe(); // Nettoyer l'écouteur lors du démontage du composant
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      dispatchUser({ type: "LOG_OUT" }); // Explicitly dispatch LOG_OUT to clear context after logout
    } catch (error) {
      console.error("Erreur lors de la déconnexion :", error);
    }
  };

  return <Provider value={{ state, dispatchUser, logout }}>{children}</Provider>;
}

export default UserProvider;
