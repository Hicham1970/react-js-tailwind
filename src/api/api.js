import { ref, get, set, remove, update } from "firebase/database";
import { database } from "../firebase";

// Ajout d'un utilisateur
export const addUser = async (userId, userData) => {
  try {
    await set(ref(database, `users/${userId}`), userData);
    return { success: true };
  } catch (error) {
    throw new Error(error.message);
  }
};

// Obtention de tous les utilisateurs
export const getUsers = async () => {
  try {
    const snapshot = await get(ref(database, "users"));
    if (snapshot.exists()) {
      return snapshot.val();
    } else {
      return {};
    }
  } catch (error) {
    throw new Error(error.message);
  }
};

// Mise à jour d'un utilisateur
export const updateUser = async (userId, userData) => {
  try {
    await update(ref(database, `users/${userId}`), userData);
    return { success: true };
  } catch (error) {
    throw new Error(error.message);
  }
};
