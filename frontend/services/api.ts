import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Mantenha o seu IP local aqui
const API_URL = 'http://10.0.0.72:5000'; 

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// INTERCEPTOR: Injeta o Token JWT em TODAS as requisições automaticamente
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('userToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;