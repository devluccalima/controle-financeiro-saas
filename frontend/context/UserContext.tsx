import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';

interface UtilizadorProps {
  id: string;
  nome: string;
  email: string;
}

interface ContextoUtilizadorProps {
  user: UtilizadorProps | null;
  setUser: React.Dispatch<React.SetStateAction<UtilizadorProps | null>>;
  loadingUser: boolean;
  carregarPerfil: () => Promise<void>;
}

const UserContext = createContext<ContextoUtilizadorProps | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UtilizadorProps | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const carregarPerfil = async () => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      if (token) {
        const response = await api.get('/users/profile');
        setUser(response.data);
      }
    } catch (error) {
      console.error("Erro ao carregar perfil global:", error);
      // Se o token for inválido ou expirar, idealmente limpa-se aqui
    } finally {
      setLoadingUser(false);
    }
  };

  useEffect(() => {
    carregarPerfil();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, loadingUser, carregarPerfil }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser deve ser usado dentro de um UserProvider');
  return context;
}