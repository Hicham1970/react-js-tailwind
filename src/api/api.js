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

// Sauvegarder les données de pesage pour un utilisateur
export const savePesageEntries = async (userId, entries) => {
  if (!userId) throw new Error("Un identifiant utilisateur est requis pour sauvegarder les données.");
  try {
    // Les données sont stockées sous un chemin spécifique à l'utilisateur
    await set(ref(database, `pesageData/${userId}`), entries);
    return { success: true };
  } catch (error) {
    throw new Error(error.message);
  }
};

// Récupérer les données de pesage pour un utilisateur
export const getPesageEntries = async (userId) => {
  if (!userId) throw new Error("Un identifiant utilisateur est requis pour récupérer les données.");
  try {
    const snapshot = await get(ref(database, `pesageData/${userId}`));
    if (snapshot.exists()) {
      return snapshot.val(); // Retourne les données si elles existent
    } else {
      return []; // Retourne un tableau vide si aucune donnée n'est trouvée
    }
  } catch (error) {
    throw new Error(error.message);
  }
};
