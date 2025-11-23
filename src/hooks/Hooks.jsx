import { useContext } from "react";

import { UserContext } from "../context/UserContext";
import { AlertContext } from "../context/AlertContext";

const useUser = () => {
  const context = useContext(UserContext);

  if (!context) {
    return { user: null, isLoading: false, isError: false, dispatchUser: () => {}, logout: async () => {} };
  }

  const { state, dispatchUser, logout } = context;

  return {
    user: state?.user || null,
    isLoading: state?.isLoading || false,
    isError: state?.isError || false,
    dispatchUser,
    logout,
  };
};

const useAppState = () => {
  const context = useContext(UserContext);
  const { state } = context || {};
  return { isLoading: state?.isLoading || false, isError: state?.isError || false };
};

const useAlert = () => {
  const { alertState, dispatchAlert } = useContext(AlertContext);

  return {
    alertState,
    dispatchAlert,
  };
};

export { useUser, useAppState, useAlert };
