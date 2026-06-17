import React, { useEffect, useRef } from 'react';
import { View, SafeAreaView, StatusBar, StyleSheet, Platform, Animated, ViewStyle } from 'react-native';
import { useTheme } from '../context/ThemeContext'; // <-- Importando o nosso motor de temas

interface InternalBackgroundProps {
  children: React.ReactNode;
}

export const InternalBackground = ({ children }: InternalBackgroundProps) => {
  const { colors, theme } = useTheme(); // <-- Puxando o tema ativo
  const glowOpacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, { toValue: 0.6, duration: 3000, useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: 0.3, duration: 3000, useNativeDriver: true }),
      ])
    ).start();
  }, [glowOpacity]);

  // Ajustando a intensidade das orbes dependendo do tema (para não sumirem no fundo branco)
  const orbTopColor = theme === 'dark' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.15)';
  const orbBottomColor = theme === 'dark' ? 'rgba(59, 130, 246, 0.06)' : 'rgba(59, 130, 246, 0.15)';

  return (
    <SafeAreaView style={[styles.bgContainer as ViewStyle, { backgroundColor: colors.background }]}>
      {/* A cor dos ícones do celular (bateria/hora) muda sozinha para dar contraste! */}
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
      
      {/* Elementos decorativos de fundo */}
      <Animated.View 
        pointerEvents="none" 
        style={[
          styles.glowOrb as ViewStyle, 
          styles.orbTop as ViewStyle, 
          { opacity: glowOpacity, backgroundColor: orbTopColor }
        ]} 
      />
      <Animated.View 
        pointerEvents="none" 
        style={[
          styles.glowOrb as ViewStyle, 
          styles.orbBottom as ViewStyle, 
          { opacity: glowOpacity, backgroundColor: orbBottomColor }
        ]} 
      />
      
      <View style={styles.bgContent as ViewStyle}>
        <View style={styles.contentWrapper as ViewStyle}>
          {children}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  bgContainer: {
    flex: 1,
    // backgroundColor: '#050A14' <-- REMOVIDO! A cor agora vem dinamicamente pelo JSX.
    paddingTop: Platform.OS === 'android' ? 40 : 0,
    overflow: 'hidden',
  } as ViewStyle,
  bgContent: {
    flex: 1,
    overflow: 'hidden',
  } as ViewStyle,
  contentWrapper: {
    flex: 1,
    paddingHorizontal: 24,
  } as ViewStyle,
  glowOrb: {
    position: 'absolute',
    borderRadius: 200
  } as ViewStyle,
  orbTop: {
    width: 300,
    height: 300,
    // backgroundColor: 'rgba(16, 185, 129, 0.08)' <-- REMOVIDO!
    top: -150,
    right: -100,
    zIndex: 0,
  } as ViewStyle,
  orbBottom: {
    width: 250,
    height: 250,
    // backgroundColor: 'rgba(59, 130, 246, 0.06)' <-- REMOVIDO!
    bottom: -100,
    left: -80,
    zIndex: 0,
  } as ViewStyle,
});