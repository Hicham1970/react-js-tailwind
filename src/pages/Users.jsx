import React, { useEffect, useState } from "react";
import { fetchAuthUsers } from "../api/api";

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true);
        const data = await fetchAuthUsers();
        setUsers(data);
      } catch (err) {
        setError(err.message || "Failed to fetch users");
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

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
    <div className="mt-10 max-w-4xl mx-auto px-4">
      <h1 className="text-2xl font-semibold mb-6">User List</h1>
      <ul className="divide-y divide-gray-300">
        {users.map((user) => (
          <li
            key={user.uid}
            className="py-3 flex justify-between items-center"
          >
            <span className="text-lg text-gray-700">{user.displayName || user.email || user.uid}</span>
            <span className="text-sm text-gray-500">{user.email || "No email"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Users;
