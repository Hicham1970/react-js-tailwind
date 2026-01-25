import { createContext, useReducer, useEffect } from "react";
import reducer, { initialState } from "../store/userReducer";
import { useAuth } from "./AuthContext.jsx";

export const UserContext = createContext();

const UserProvider = ({ children }) => {
  const [state, dispatchUser] = useReducer(reducer, initialState);
  const { currentUser, loading } = useAuth();

  // Synchroniser Firebase Auth avec le UserContext existant
  useEffect(() => {
    if (!loading) {
      if (currentUser) {
        dispatchUser({ 
          type: "LOG_IN", 
          payload: { ...currentUser, username: currentUser.displayName || currentUser.email } 
        });
      } else {
        dispatchUser({ type: "LOG_OUT" });
      }
    }
  }, [currentUser, loading]);

  return (
    <UserContext.Provider value={{ state, dispatchUser }}>
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider;