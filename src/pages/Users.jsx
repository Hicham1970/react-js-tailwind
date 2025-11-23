import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchAuthUsers, deleteUser } from "../api/api";

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function loadUsers() {
      try {
        setLoading(true);
        setError(null);
        const usersData = await fetchAuthUsers();
        console.log("Users loaded:", usersData); // Debug
        setUsers(Array.isArray(usersData) ? usersData : []);
      } catch (err) {
        console.error("Error loading users:", err);
        setError(err.message || "Failed to fetch users");
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
  }, []);

  // Filtrer les utilisateurs selon la recherche
  const filteredUsers = users.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    const displayName = (user.displayName || "").toLowerCase();
    const email = (user.email || "").toLowerCase();
    return displayName.includes(searchLower) || email.includes(searchLower);
  });

  const handleDelete = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await deleteUser(userId);
        setUsers(users.filter((user) => user.uid !== userId));
      } catch (err) {
        alert("Failed to delete user: " + err.message);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center mt-20 text-lg text-gray-600">
        Loading users...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center mt-20 text-lg text-red-600">
        Error: {error}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex justify-center mt-20 text-lg text-gray-600">
        No users found.
      </div>
    );
  }

  return (
    <div className="mt-10 max-w-6xl mx-auto px-4">
      <h1 className="text-3xl font-semibold mb-6">User Management</h1>

      {/* Barre de recherche */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Résultats de recherche */}
      {filteredUsers.length === 0 ? (
        <div className="text-center text-gray-600 py-8">
          No users match your search.
        </div>
      ) : (
        <div className="overflow-x-auto shadow-md rounded-lg">
          <table className="w-full border-collapse">
            <thead className="bg-gray-200">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Name</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Email</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">UID</th>
                <th className="px-6 py-3 text-center font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr
                  key={user.uid}
                  className="border-b border-gray-300 hover:bg-gray-50 transition"
                >
                  <td className="px-6 py-4 text-gray-800">
                    {user.displayName || "No name"}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{user.email || "No email"}</td>
                  <td className="px-6 py-4 text-gray-500 text-sm font-mono">
                    {user.uid}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-2">
                      {/* Bouton Voir profil */}
                      <Link
                        to={`/user/${user.uid}`}
                        className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition text-sm"
                      >
                        View Profile
                      </Link>

                      {/* Bouton Éditer */}
                      <Link
                        to={`/edit/${user.uid}`}
                        className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 transition text-sm"
                      >
                        Edit
                      </Link>

                      {/* Bouton Supprimer */}
                      <button
                        onClick={() => handleDelete(user.uid)}
                        className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Compteur d'utilisateurs */}
      <div className="mt-6 text-gray-600">
        Showing {filteredUsers.length} of {users.length} users
      </div>
    </div>
  );
}

export default Users;
