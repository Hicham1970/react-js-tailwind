import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import UserProvider from "./context/UserContext";
import AlertProvider from "./context/AlertContext";
import { ThemeProvider } from "./context/ThemeContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <AlertProvider>
        <UserProvider>
          <App />
        </UserProvider>
      </AlertProvider>
    </ThemeProvider>
  </React.StrictMode>
);
