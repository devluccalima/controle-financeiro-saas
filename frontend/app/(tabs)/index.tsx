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
} from "react-native";
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

import { Alert } from "react-native";
import api from "../../services/api";

import AnimatedBackground from '../../components/AnimatedBackground';

// --- COMPONENTES VISUAIS ---



// --- TELA PRINCIPAL (Sem o { navigation }) ---
export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const cardAnim = useRef(new Animated.Value(60)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const logoAnim = useRef(new Animated.Value(-30)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoAnim, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(cardAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [cardAnim, cardOpacity, logoAnim, logoOpacity]);

  const handleLogin = async () => {
    // 1. Validação simples
    if (!email || !password) {
      Alert.alert("Atenção", "Por favor, preencha seu e-mail e senha.");
      return;
    }

    try {
      // 2. Disparo para a API (lembrando de usar a chave "senha" que seu backend prefere)
      const response = await api.post('/auth/login', {
        email: email,
        senha: password
      });

      // 3. Sucesso: A API deve devolver o Token JWT!
       // 3. Sucesso: A API deve devolver o Token JWT!
      if (response.status === 200) {
        const token = response.data.token || response.data.access_token; 
        
        // Salva o token no cofre do celular
        await SecureStore.setItemAsync('userToken', token);
        
        Alert.alert("Acesso Liberado!", "Bem-vindo ao Vynce Finance.");
        
        setEmail("");
        setPassword("");

        // Redireciona para o painel interno
        router.replace('/dashboard');
      }
    } catch (error: any) {
      // 4. Captura de erro (ex: senha errada, e-mail não existe)
      const mensagemErro = error.response?.data?.erro || "Credenciais inválidas. Tente novamente.";
      Alert.alert("Login Falhou", mensagemErro);
      console.log("Erro de login:", error);
    }
  };

  const handleRegister = () => {
    router.push("/register");
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#050A14" />

      <AnimatedBackground />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo / Header */}
          <Animated.View
            style={[
              styles.header,
              {
                transform: [{ translateY: logoAnim }],
                opacity: logoOpacity,
              },
            ]}
          >
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

          {/* Card de login */}
          <Animated.View
            style={[
              styles.card,
              {
                transform: [{ translateY: cardAnim }],
                opacity: cardOpacity,
              },
            ]}
          >
            <Text style={styles.cardTitle}>Acessar conta</Text>
            <Text style={styles.cardSubtitle}>
              Faça login para visualizar seu dashboard financeiro.
            </Text>

            {/* Campo Email */}
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

            {/* Campo Senha */}
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
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                  activeOpacity={0.7}
                >
                  <Feather name={showPassword ? "eye-off" : "eye"} size={20} color="#4A5980" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Esqueci a senha */}
            <TouchableOpacity
              style={styles.forgotRow}
              activeOpacity={0.7}
              onPress={() => router.push('/recover')}
            >
              <Text style={styles.forgotText}>Esqueci minha senha</Text>
            </TouchableOpacity>

            {/* Botão Entrar */}
            <TouchableOpacity
              style={styles.btnPrimary}
              onPress={handleLogin}
              activeOpacity={0.85}
            >
              <Text style={styles.btnPrimaryText}>Entrar</Text>
              <Feather name="arrow-right" size={20} color="#050A14" />
            </TouchableOpacity>

            {/* Divisor */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Botão Criar conta */}
            <TouchableOpacity
              style={styles.btnSecondary}
              onPress={handleRegister}
              activeOpacity={0.85}
            >
              <Text style={styles.btnSecondaryText}>Criar uma conta</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Rodapé */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Seus dados protegidos com criptografia de ponta a ponta
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#050A14" },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 70, paddingBottom: 40 },
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
  fieldGroup: { marginBottom: 16 },
  fieldLabel: { fontSize: 12, fontWeight: "600", color: "#4A5980", marginBottom: 8, letterSpacing: 0.8, textTransform: "uppercase" },
  inputWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: "#0E1628", borderRadius: 12, borderWidth: 1, borderColor: "#1A2540", paddingHorizontal: 14, height: 52 },
  inputIcon: { fontSize: 16, marginRight: 10, opacity: 0.5 },
  input: { flex: 1, fontSize: 15, color: "#FFFFFF", height: "100%" },
  eyeBtn: { paddingLeft: 8 },
  eyeIcon: { fontSize: 16, opacity: 0.5 },
  forgotRow: { alignItems: "flex-end", marginBottom: 24, marginTop: 4 },
  forgotText: { fontSize: 13, color: "#10B981" },
  btnPrimary: { backgroundColor: "#10B981", borderRadius: 14, height: 54, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, shadowColor: "#10B981", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 10 },
  btnPrimaryText: { fontSize: 16, fontWeight: "700", color: "#050A14", letterSpacing: 0.2 },
  btnArrow: { fontSize: 18, color: "#050A14", fontWeight: "700" },
  divider: { flexDirection: "row", alignItems: "center", marginVertical: 20, gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#1A2540" },
  dividerText: { fontSize: 13, color: "#2D3B55" },
  btnSecondary: { borderRadius: 14, height: 54, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#1A2540", backgroundColor: "transparent" },
  btnSecondaryText: { fontSize: 15, fontWeight: "600", color: "#7B8DB0" },
  footer: { marginTop: 28, alignItems: "center" },
  footerText: { fontSize: 12, color: "#2D3B55", textAlign: "center" },
});