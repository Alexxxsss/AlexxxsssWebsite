// src/apiClient.js
import axios from 'axios';

// This line is key. It reads an environment variable for the production URL,
// but falls back to '/api' for local development.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

export default apiClient;