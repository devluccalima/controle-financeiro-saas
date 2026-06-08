import React, { useEffect, useRef } from "react";
import { View, Animated, Dimensions, StyleSheet, Platform } from "react-native";

const { width, height } = Dimensions.get("window");

interface ParticleProps { index: number; }
interface GlowOrbProps { top: number; left: number; color: string; size: number; }

function Particle({ index }: ParticleProps) {
  const x = useRef(new Animated.Value(Math.random() * width)).current;
  const y = useRef(new Animated.Value(Math.random() * height)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.4)).current;
  
  // Partículas levemente maiores
  const size = 6 + Math.random() * 8; 
  const duration = 6000 + Math.random() * 8000;
  const delay = index * 200; // Começam a aparecer mais rápido
  const symbols = ["$", "%", "↑", "↗", "◆", "▲", "•", "○"];
  const symbol = symbols[index % symbols.length];

  useEffect(() => {
    const toX = Math.random() * width;
    const toY = Math.random() * height;
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          // OPACIDADE AUMENTADA: Agora brilham até 60% em vez de 35%
          Animated.timing(opacity, { toValue: 0.3 + Math.random() * 0.3, duration: duration * 0.3, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 0.8 + Math.random() * 0.6, duration: duration * 0.3, useNativeDriver: true }),
          Animated.timing(x, { toValue: toX, duration, useNativeDriver: true }),
          Animated.timing(y, { toValue: toY, duration, useNativeDriver: true }),
        ]),
        Animated.timing(opacity, { toValue: 0, duration: duration * 0.2, useNativeDriver: true }),
      ])
    ).start();
  }, [delay, duration, index, opacity, scale, x, y]);

  return (
    <Animated.Text style={[styles.particle, { fontSize: size + 8, transform: [{ translateX: x }, { translateY: y }, { scale }], opacity }]}>
      {symbol}
    </Animated.Text>
  );
}

function GridLines() {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.timing(anim, { toValue: 1, duration: 12000, useNativeDriver: true })).start();
  }, [anim]);
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 60] });

  return (
    <Animated.View style={[styles.gridContainer, { transform: [{ translateY }] }]} pointerEvents="none">
      {Array.from({ length: 14 }).map((_, i) => <View key={`h-${i}`} style={[styles.gridLineH, { top: i * 60 }]} />)}
      {Array.from({ length: 10 }).map((_, i) => <View key={`v-${i}`} style={[styles.gridLineV, { left: i * (width / 9) }]} />)}
    </Animated.View>
  );
}

function GlowOrb({ top, left, color, size }: GlowOrbProps) {
  const pulse = useRef(new Animated.Value(0.6)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 3000 + Math.random() * 2000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.6, duration: 3000 + Math.random() * 2000, useNativeDriver: true }),
      ])
    ).start();
  }, [pulse]);

  return <Animated.View pointerEvents="none" style={[styles.orb, { top, left, width: size, height: size, borderRadius: size / 2, backgroundColor: color, opacity: pulse }]} />;
}

export default function AnimatedBackground() {
  return (
    <View style={styles.background}>
      <GridLines />
      <GlowOrb top={-80} left={-80} color="#0D6EFD22" size={320} />
      <GlowOrb top={height * 0.5} left={width * 0.6} color="#10B98122" size={280} />
      <GlowOrb top={height * 0.15} left={width * 0.55} color="#6366F122" size={200} />
      
      {/* QUANTIDADE AUMENTADA: De 18 para 30 partículas */}
      {Array.from({ length: 30 }).map((_, i) => <Particle key={i} index={i} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  background: { ...StyleSheet.absoluteFillObject, overflow: "hidden" },
  gridContainer: { ...StyleSheet.absoluteFillObject },
  
  // GRID MAIS PRESENTE: Passado de 08 para 15 no final do hexadecimal (canal alfa/transparência)
  gridLineH: { position: "absolute", left: 0, right: 0, height: 1, backgroundColor: "#0D6EFD15" },
  gridLineV: { position: "absolute", top: 0, bottom: 0, width: 1, backgroundColor: "#0D6EFD15" },
  
  orb: { position: "absolute" },
  particle: { position: "absolute", color: "#10B981", fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace" },
});