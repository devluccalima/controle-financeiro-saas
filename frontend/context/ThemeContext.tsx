import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// 1. Definição das paletas de cores para cada tema
export const coresTema = {
  dark: {
    background: '#050A14',
    card: '#0B1120',
    border: '#1A2540',
    text: '#FFFFFF',
    textMuted: '#7B8DB0',
    textDark: '#4A5980',
    inputBg: '#0E1628',
    primary: '#10B981', // Verde Vynce
    secondary: '#3B82F6', // Azul Contas
    danger: '#EF4444',
  },
  light: {
    background: '#F4F6F9',
    card: '#FFFFFF',
    border: '#E2E8F0',
    text: '#0F172A',
    textMuted: '#64748B',
    textDark: '#94A3B8',
    inputBg: '#F1F5F9',
    primary: '#10B981', 
    secondary: '#3B82F6',
    danger: '#EF4444',
  }
};

type TipoTema = 'light' | 'dark';

interface ContextoTemaProps {
  theme: TipoTema;
  colors: typeof coresTema.dark;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ContextoTemaProps | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const sistemaTema = useColorScheme(); // Pega o tema padrão do celular do usuário
  const [theme, setTheme] = useState<TipoTema>('dark');

  // Carrega a preferência salva pelo usuário ao abrir o app
  useEffect(() => {
    async function carregarTemaSalvo() {
      const temaSalvo = await SecureStore.getItemAsync('userTheme');
      if (temaSalvo === 'light' || temaSalvo === 'dark') {
        setTheme(temaSalvo);
      } else if (sistemaTema) {
        setTheme(sistemaTema); // Se não tiver salvo, usa o do sistema
      }
    }
    carregarTemaSalvo();
  }, [sistemaTema]);

  const toggleTheme = async () => {
    const novoTema = theme === 'dark' ? 'light' : 'dark';
    setTheme(novoTema);
    await SecureStore.setItemAsync('userTheme', novoTema); // Salva no cofre do aparelho
  };

  const colors = theme === 'dark' ? coresTema.dark : coresTema.light;

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook personalizado para usar o tema de forma simples nas telas
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  return context;
}