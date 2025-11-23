import React from "react";
import { addUser } from "../api/api";

const testUsers = {
  "user1": { name: "Alice Smith", email: "alice@example.com" },
  "user2": { name: "Bob Johnson", email: "bob@example.com" }
};

function AddTestUsers() {
  const handleAddUsers = async () => {
    try {
      for (const [userId, userData] of Object.entries(testUsers)) {
        await addUser(userId, userData);
      }
      alert("Test users added successfully.");
    } catch (error) {
      alert("Failed to add test users: " + error.message);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-4 border rounded text-center">
      <h2 className="text-xl font-semibold mb-4">Add Test Users</h2>
      <button
        onClick={handleAddUsers}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Add Sample Users
      </button>
    </div>
  );
}

export default AddTestUsers;
