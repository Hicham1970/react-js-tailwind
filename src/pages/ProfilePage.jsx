import React from "react";
import { useUser } from "../hooks/Hooks";
import Profile from "../components/Profile";

function ProfilePage() {
  const { user } = useUser();
  if (!user) return <div>Chargement...</div>;
  return (
    <div className="flex justify-center mt-20">
      <Profile username={user.displayName} email={user.email} />
    </div>
  );
}

export default ProfilePage;