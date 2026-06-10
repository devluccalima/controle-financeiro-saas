import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert
} from "react-native";
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

import api from "../services/api";
import AnimatedBackground from '../components/AnimatedBackground';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const cardAnim = useRef(new Animated.Value(60)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      Animated.timing(cardOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [cardAnim, cardOpacity]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Atenção", "Por favor, preencha seu e-mail e senha.");
      return;
    }

    try {
      const response = await api.post('/auth/login', { email, senha: password });

      if (response.status === 200) {
        const token = response.data.token || response.data.access_token; 
        await SecureStore.setItemAsync('userToken', token);
        
        setEmail("");
        setPassword("");
        router.replace('/(tabs)/dashboard');
      }
    } catch (error: any) {
      const mensagemErro = error.response?.data?.erro || "Credenciais inválidas. Tente novamente.";
      Alert.alert("Login Falhou", mensagemErro);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#050A14" />
      <AnimatedBackground />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          
          {/* Header Compacto com Botão Voltar (Estilo copiado da sua tela de Registro) */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Feather name="arrow-left" size={24} color="#7B8DB0" />
            </TouchableOpacity>
            <Text style={styles.appName}>Fazer Login</Text>
          </View>

          {/* Card de login */}
          <Animated.View style={[styles.card, { transform: [{ translateY: cardAnim }], opacity: cardOpacity }]}>
            
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>E-mail</Text>
              <View style={styles.inputWrapper}>
                <Feather name="mail" size={20} color="#4A5980" style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.input}
                  placeholder="seu@email.com"
                  placeholderTextColor="#3A4560"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Senha</Text>
              <View style={styles.inputWrapper}>
                <Feather name="lock" size={20} color="#4A5980" style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#3A4560"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Feather name={showPassword ? "eye-off" : "eye"} size={20} color="#4A5980" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.forgotRow} onPress={() => router.push('/recover')}>
              <Text style={styles.forgotText}>Esqueci minha senha</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnPrimary} onPress={handleLogin} activeOpacity={0.85}>
              <Text style={styles.btnPrimaryText}>Entrar</Text>
              <Feather name="log-in" size={20} color="#050A14" />
            </TouchableOpacity>

          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// Estilos herdados da sua identidade visual
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#050A14" },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  header: { marginBottom: 36, flexDirection: "row", alignItems: "center" },
  backButton: { marginRight: 16, padding: 8, backgroundColor: "#0E1628", borderRadius: 12, borderWidth: 1, borderColor: "#1A2540" },
  appName: { fontSize: 22, fontWeight: "700", color: "#FFFFFF", letterSpacing: -0.5 },
  card: { backgroundColor: "#0B1120", borderRadius: 24, borderWidth: 1, borderColor: "#1A2540", padding: 28, shadowColor: "#000", shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.5, shadowRadius: 40, elevation: 20 },
  fieldGroup: { marginBottom: 16 },
  fieldLabel: { fontSize: 12, fontWeight: "600", color: "#4A5980", marginBottom: 8, letterSpacing: 0.8, textTransform: "uppercase" },
  inputWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: "#0E1628", borderRadius: 12, borderWidth: 1, borderColor: "#1A2540", paddingHorizontal: 14, height: 52 },
  input: { flex: 1, fontSize: 15, color: "#FFFFFF", height: "100%" },
  eyeBtn: { paddingLeft: 8 },
  forgotRow: { alignItems: "flex-end", marginBottom: 24, marginTop: 4 },
  forgotText: { fontSize: 13, color: "#10B981" },
  btnPrimary: { backgroundColor: "#10B981", borderRadius: 14, height: 54, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, shadowColor: "#10B981", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 10 },
  btnPrimaryText: { fontSize: 16, fontWeight: "700", color: "#050A14", letterSpacing: 0.2 },
});