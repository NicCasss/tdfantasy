import axios from "axios";

const API_BASE_URL = import.meta.env.PROD
  ? import.meta.env.VITE_API_URL
  : import.meta.env.VITE_API_URL || "http://localhost:8000";

if (import.meta.env.PROD && !API_BASE_URL) {
  throw new Error("VITE_API_URL non configurata in produzione");
}

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

export default api;
