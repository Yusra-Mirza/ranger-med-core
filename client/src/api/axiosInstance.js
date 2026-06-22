import axios from "axios";

const instance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
  withCredentials:true
});

// ----- GLOBAL LOCK -----
let isRefreshing = false;
let refreshPromise = null;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

// Request interceptor
let accessToken = null;

export const setAccessToken = (token) => {
  accessToken = token;
};

export const getAccessToken = () => {
  return accessToken;
};

instance.interceptors.request.use(
  (config) => {
    
    if (accessToken) config.headers["Authorization"] = `Bearer ${accessToken}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
instance.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    // If token expired
    if (error.response?.status === 403 && !originalRequest._retry) {
      originalRequest._retry = true;

      // If refresh already in progress → wait
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers["Authorization"] = "Bearer " + token;
            return instance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      // Otherwise → start refresh
      isRefreshing = true;
      refreshPromise = instance.post("/auth/refresh");

      try {
        const res = await refreshPromise;

        const newAccess = res.data.accessToken;
        
        setAccessToken(newAccess);

        instance.defaults.headers.common["Authorization"] = "Bearer " + newAccess;

        processQueue(null, newAccess);

        originalRequest.headers["Authorization"] = "Bearer " + newAccess;

        return instance(originalRequest);
      } catch (err) {
        processQueue(err, null);
        setAccessToken(null);

        window.location.href = "/login";
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default instance;
