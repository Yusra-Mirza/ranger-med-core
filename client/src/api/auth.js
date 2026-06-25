import axios from "./axiosInstance";

export const registerRanger = async (data) => {
  try {
    const response = await axios.post("/auth/register", data);
    return response.data;
  } catch (error) {
    return error.response?.data || { error: error.message };
  }
};

export const loginRanger = async (data) => {
  try {
    const response = await axios.post("/auth/login", data);
    return response.data;
  } catch (error) {
    return error.response?.data || { error: error.message };
  }
};

export const logoutRanger = async (data) => {
  try {
    const response = await axios.post("/auth/logout", data);
    return response.data;
  } catch (error) {
    return error.response?.data || { error: error.message };
  }
};