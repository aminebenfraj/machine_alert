import { getCurrentUser, login } from "@/lib/Auth";
import React, { createContext, useState, useEffect, useContext } from "react";
 // Adjust the import path as necessary


const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const initAuth = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);

      return currentUser;
    } catch (error) {
      console.error("Failed to fetch user:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (localStorage.getItem("accessToken")) {
      initAuth();
    } else {
      setLoading(false);
    }

    const handleStorageChange = (event) => {
      if (event.key === "accessToken") {
        if (event.newValue === null) {
          setUser(null);
          window.location.reload();
        } else {
          initAuth();
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const loginUser = async (email, password) => {
    try {
      await login(email, password);
      await initAuth();
    } catch (error) {
      console.error("Error fetching cart:", error);
    }
  };

  const logoutUser = () => {
    localStorage.removeItem("accessToken");
    setUser(null);
  };

  const value = {
    user,
    login: loginUser,
    logout: logoutUser,
    setUser,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
