import axios from "axios";

const developmentApiUrl = `${window.location.protocol}//${window.location.hostname}:5001/api`;

export const API_BASE_URL =
  import.meta.env.MODE === "development"
    ? developmentApiUrl
    : import.meta.env.VITE_API_URL || "/api";

export const API_ORIGIN =
  API_BASE_URL.replace(/\/api\/?$/, "") || window.location.origin;

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 20000,
});
