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

// Suppression d'un utilisateur
export const deleteUser = async (userId) => {
  try {
    await remove(ref(database, `users/${userId}`));
    return { success: true };
  } catch (error) {
    throw new Error(error.message);
  }
};

// Fetch Firebase Authentication users from Cloud Function API
export const fetchAuthUsers = async () => {
  try {
    // TODO: Replace <YOUR_CLOUD_FUNCTION_URL> with your deployed Cloud Function URL
    const response = await fetch("<YOUR_CLOUD_FUNCTION_URL>/listUsers");
    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }
    const data = await response.json();
    return data.users || [];
  } catch (error) {
    throw new Error(error.message);
  }
};
