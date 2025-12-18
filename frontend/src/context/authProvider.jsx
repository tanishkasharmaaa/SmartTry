import { useState, useEffect } from "react";
import AuthContext from "./authContext";
import Cookies from "js-cookie";

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("userInfo");
    return saved ? JSON.parse(saved) : null;
  });
  const [authenticated, setAuthenticated] = useState(!!user);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(
          "https://smarttry.onrender.com/auth/profile",
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (response.status === 401) {
          // ❌ DO NOTHING — user might not be logged in yet
          return;
        }

        if (!response.ok) {
          throw new Error("Unexpected error");
        }

        const data = await response.json();
        // console.log(data)
        setUser(data);
        setAuthenticated(true);
        localStorage.setItem("userInfo", JSON.stringify(data));
      } catch (error) {
        console.warn("Profile check skipped:", error.message);
        // ❌ DO NOT LOGOUT HERE
      }
    };

    fetchProfile();
  }, []);

  const logout = async () => {
    try {
      await fetch("https://smarttry.onrender.com/auth/logout", {
        method: "GET",
        credentials: "include",
      });
    } catch (error) {
      console.warn("Logout request failed:", error.message);
    }

    setUser(null);
    setAuthenticated(false);
    localStorage.removeItem("userInfo");
  };

  return (
    <AuthContext.Provider
      value={{ user, authenticated, setUser, setAuthenticated, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
