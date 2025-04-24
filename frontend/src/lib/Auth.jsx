import axios from "axios";

// Base API URL
const API_URL = "https://machine-alert.onrender.com/api";

// 🔹 Login function (Now uses `license` instead of `email`)
export const login = async (license, password) => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      license, // ✅ Ensure backend expects license
      password,
    });

    // Store token securely
    localStorage.setItem("accessToken", response.data.token);
    return response.data;
  } catch (error) {
    console.error("Login error:", error);

    if (error.response) {
      throw new Error(error.response.data.message || "Login failed");
    } else if (error.request) {
      throw new Error("No response received from server");
    } else {
      throw new Error("An error occurred during login");
    }
  }
};

// 🔹 Register function (Ensures roles are sent as an array)
export const register = async (license, username, email, password, roles = ["User"]) => {
  try {
    const response = await axios.post(`${API_URL}/auth/register`, {
      license,
      username,
      email,
      password,
      roles, // ✅ Ensures roles are in array format
    });

    return response.data;
  } catch (error) {
    console.error("Register error:", error);

    if (error.response) {
      throw new Error(error.response.data.message || "Registration failed");
    } else if (error.request) {
      throw new Error("No response received from server");
    } else {
      throw new Error("An error occurred during registration");
    }
  }
};

// 🔹 Fetch current user details (Corrected API endpoint)
export const getCurrentUser = async () => {
  try {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      throw new Error("No access token found");
    }

    const response = await axios.get(`${API_URL}/users/profile`, { // ✅ Correct API route
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Failed to fetch user details:", error);
    return null;
  }
};

// 🔹 Logout function
export const logout = () => {
  localStorage.removeItem("accessToken");
};
