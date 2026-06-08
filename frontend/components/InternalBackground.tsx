import React, { useEffect, useRef } from 'react';
import { View, SafeAreaView, StatusBar, StyleSheet, Platform, Animated, ViewStyle } from 'react-native';

interface InternalBackgroundProps {
  children: React.ReactNode;
}

export const InternalBackground = ({ children }: InternalBackgroundProps) => {
  const glowOpacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, { toValue: 0.6, duration: 3000, useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: 0.3, duration: 3000, useNativeDriver: true }),
      ])
    ).start();
  }, [glowOpacity]);

  return (
    <SafeAreaView style={styles.bgContainer as ViewStyle}>
      <StatusBar barStyle="light-content" />
      
      {/* Elementos decorativos de fundo */}
      {/* Elementos decorativos de fundo */}
      <Animated.View pointerEvents="none" style={[styles.glowOrb as ViewStyle, styles.orbTop as ViewStyle, { opacity: glowOpacity }]} />
      <Animated.View pointerEvents="none" style={[styles.glowOrb as ViewStyle, styles.orbBottom as ViewStyle, { opacity: glowOpacity }]} />
      
      {/* Linhas decorativas sutis (Comentadas pois nao achei necessario) */}
      {/* <View style={styles.accentLine1 as ViewStyle} />
      <View style={styles.accentLine2 as ViewStyle} /> */}
      
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
    backgroundColor: '#050A14',
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
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    top: -150,
    right: -100,
    zIndex: 0,
  } as ViewStyle,
  orbBottom: {
    width: 250,
    height: 250,
    backgroundColor: 'rgba(59, 130, 246, 0.06)',
    bottom: -100,
    left: -80,
    zIndex: 0,
  } as ViewStyle,
  accentLine1: {
    position: 'absolute',
    width: '80%',
    height: 1,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    top: '30%',
    left: '10%',
    zIndex: 0,
  } as ViewStyle,
  accentLine2: {
    position: 'absolute',
    width: '70%',
    height: 1,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    bottom: '25%',
    right: '10%',
    zIndex: 0,
  } as ViewStyle,
});