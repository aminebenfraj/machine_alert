import { apiRequest } from "./api";

const BASE_URL = "api/users"; // ✅ Matches your backend route

// ✅ Get Current User Profile (Protected)
export const getCurrentUser = () => {
  return apiRequest("GET", `${BASE_URL}/profile`);
};

// ✅ Update Current User Profile
export const updateCurrentUser = (data) => {
  return apiRequest("PUT", `${BASE_URL}/update-profile`, data);
};

// ✅ Update User Roles (Admin Only) - Uses `license` instead of `id`
export const updateUserRoles = (license, roles) => {
  return apiRequest("PUT", `${BASE_URL}/role/${license}`, { roles });
};

// ✅ Delete Current User (Self-Deletion)
export const deleteCurrentUser = () => {
  return apiRequest("DELETE", `${BASE_URL}/delete`);
};

export const getRecentUsers = () => {
  return apiRequest("GET", `${BASE_URL}/recent`);
};