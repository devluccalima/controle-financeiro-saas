import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  StatusBar,
  Platform,
  ScrollView,
} from "react-native";
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import AnimatedBackground from '../components/AnimatedBackground';

export default function WelcomeScreen() {
  const router = useRouter();

  const cardAnim = useRef(new Animated.Value(60)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const logoAnim = useRef(new Animated.Value(-30)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(cardAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
        Animated.timing(cardOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
    ]).start();
  }, [cardAnim, cardOpacity, logoAnim, logoOpacity]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#050A14" />
      <AnimatedBackground />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Logo / Header */}
        <Animated.View style={[styles.header, { transform: [{ translateY: logoAnim }], opacity: logoOpacity }]}>
          <View style={styles.logoContainer}>
            <View style={styles.logoIconBox}>
              <Text style={styles.logoIcon}>◆</Text>
            </View>
            <Text style={styles.appName}>Vynce Finance</Text>
          </View>
          <View style={styles.taglineBox}>
            <Text style={styles.tagline}>
              Controle inteligente do seu{"\n"}
              <Text style={styles.taglineAccent}>dinheiro, em um só lugar.</Text>
            </Text>
          </View>
        </Animated.View>

        {/* Card de Boas-vindas */}
        <Animated.View style={[styles.card, { transform: [{ translateY: cardAnim }], opacity: cardOpacity }]}>
          <Text style={styles.cardTitle}>Bem-vindo ao Vynce</Text>
          <Text style={styles.cardSubtitle}>
            Escolha uma opção abaixo para começar a gerenciar seu futuro.
          </Text>

          {/* Botão Entrar */}
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={() => router.push('/login')}
            activeOpacity={0.85}
          >
            <Text style={styles.btnPrimaryText}>Entrar na minha conta</Text>
            <Feather name="arrow-right" size={20} color="#050A14" />
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Botão Criar conta */}
          <TouchableOpacity
            style={styles.btnSecondary}
            onPress={() => router.push('/register')}
            activeOpacity={0.85}
          >
            <Text style={styles.btnSecondaryText}>Criar uma conta gratuita</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Rodapé */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Seus dados protegidos com criptografia de ponta a ponta
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// Os estilos exatos que você já tinha criado
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#050A14" },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 70, paddingBottom: 40, justifyContent: 'center' },
  header: { marginBottom: 36 },
  logoContainer: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 },
  logoIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#10B981", alignItems: "center", justifyContent: "center" },
  logoIcon: { fontSize: 18, color: "#050A14" },
  appName: { fontSize: 22, fontWeight: "700", color: "#FFFFFF", letterSpacing: -0.5 },
  taglineBox: {},
  tagline: { fontSize: 28, fontWeight: "300", color: "#7B8DB0", lineHeight: 38, letterSpacing: -0.3 },
  taglineAccent: { color: "#FFFFFF", fontWeight: "600" },
  card: { backgroundColor: "#0B1120", borderRadius: 24, borderWidth: 1, borderColor: "#1A2540", padding: 28, shadowColor: "#000", shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.5, shadowRadius: 40, elevation: 20 },
  cardTitle: { fontSize: 20, fontWeight: "700", color: "#FFFFFF", marginBottom: 6, letterSpacing: -0.3 },
  cardSubtitle: { fontSize: 14, color: "#4A5980", marginBottom: 28, lineHeight: 20 },
  btnPrimary: { backgroundColor: "#10B981", borderRadius: 14, height: 54, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, shadowColor: "#10B981", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 10 },
  btnPrimaryText: { fontSize: 16, fontWeight: "700", color: "#050A14", letterSpacing: 0.2 },
  divider: { flexDirection: "row", alignItems: "center", marginVertical: 20, gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#1A2540" },
  dividerText: { fontSize: 13, color: "#2D3B55" },
  btnSecondary: { borderRadius: 14, height: 54, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#1A2540", backgroundColor: "transparent" },
  btnSecondaryText: { fontSize: 15, fontWeight: "600", color: "#7B8DB0" },
  footer: { marginTop: 28, alignItems: "center" },
  footerText: { fontSize: 12, color: "#2D3B55", textAlign: "center" },
});