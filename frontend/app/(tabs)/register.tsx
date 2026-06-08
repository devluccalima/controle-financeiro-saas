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
import { Alert } from 'react-native';

import AnimatedBackground from '../../components/AnimatedBackground';
import api from '../../services/api';

// --- TELA DE REGISTRO ---
export default function RegisterScreen() {
  const router = useRouter(); // O motor de navegação

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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

  const handleRegister = async () => {
    // 1. Validação básica de front-end
    if (!nome || !email || !password) {
      Alert.alert("Erro", "Preencha todos os campos.");
      return;
    }
    
    if (password !== confirmPassword) {
      Alert.alert("Erro", "As senhas não coincidem!");
      return;
    }

    try {
      // 2. Disparo para a API Python
      const response = await api.post('/users', {
        nome: nome,
        email: email,
        senha: password
      });

      // 3. Sucesso!
      if (response.status === 201 || response.status === 200) {
        Alert.alert("Sucesso!", "Conta criada com sucesso.", [
          { text: "Fazer Login", onPress: () => router.back() } // Joga de volta pra tela inicial
        ]);
      }
    } catch (error: any) {
      // 4. Tratamento do erro (ex: e-mail já existe no PostgreSQL)
      const mensagemErro = error.response?.data?.erro || "Erro ao conectar com o servidor.";
      Alert.alert("Falha no Registro", mensagemErro);
      console.log("Erro completo:", error);
    }
  };
  
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#050A14" />

      {/* Background */}
      <AnimatedBackground />
      

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          
          {/* Header Compacto */}
          <Animated.View style={[styles.header, { transform: [{ translateY: logoAnim }], opacity: logoOpacity }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Feather name="arrow-left" size={24} color="#7B8DB0" />
            </TouchableOpacity>
            <View style={styles.logoContainer}>
              <View style={styles.logoIconBox}>
                    <Text style={styles.logoIcon}>◆</Text>
                </View>
              <Text style={styles.appName}>Vynce Finance</Text>
            </View>
          </Animated.View>

          {/* Card de Registro */}
          <Animated.View style={[styles.card, { transform: [{ translateY: cardAnim }], opacity: cardOpacity }]}>
            <Text style={styles.cardTitle}>Criar nova conta</Text>
            <Text style={styles.cardSubtitle}>Construa um futuro financeiro mais inteligente.</Text>

            {/* Campo Nome */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Nome Completo</Text>
              <View style={styles.inputWrapper}>
                <Feather name="user" size={20} color="#4A5980" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Seu nome"
                  placeholderTextColor="#3A4560"
                  value={nome}
                  onChangeText={setNome}
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Campo Email */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>E-mail</Text>
              <View style={styles.inputWrapper}>
                <Feather name="mail" size={20} color="#4A5980" style={styles.inputIcon} />
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
                <Feather name="lock" size={20} color="#4A5980" style={styles.inputIcon} />
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

            {/* Campo Confirmar Senha */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Confirmar Senha</Text>
              <View style={styles.inputWrapper}>
                <Feather name="check-circle" size={20} color="#4A5980" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#3A4560"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Botão Registrar */}
            <TouchableOpacity style={styles.btnPrimary} onPress={handleRegister} activeOpacity={0.85}>
              <Text style={styles.btnPrimaryText}>Criar minha conta</Text>
              <Feather name="arrow-right" size={20} color="#050A14" />
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Voltar para Login */}
            <TouchableOpacity style={styles.btnSecondary} onPress={() => router.back()} activeOpacity={0.85}>
              <Text style={styles.btnSecondaryText}>Já tenho uma conta</Text>
            </TouchableOpacity>

          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// Os estilos são idênticos aos do index, com leves ajustes de margem
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#050A14" },
  flex: { flex: 1 },
  background: { ...StyleSheet.absoluteFillObject, overflow: "hidden" },
  gridContainer: { ...StyleSheet.absoluteFillObject },
  gridLineH: { position: "absolute", left: 0, right: 0, height: 1, backgroundColor: "#0D6EFD08" },
  gridLineV: { position: "absolute", top: 0, bottom: 0, width: 1, backgroundColor: "#0D6EFD08" },
  orb: { position: "absolute" },
  particle: { position: "absolute", color: "#10B981", fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace" },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 50, paddingBottom: 40 },
  header: { marginBottom: 24, flexDirection: "row", alignItems: "center" },
  backButton: { marginRight: 16, padding: 8, backgroundColor: "#0E1628", borderRadius: 12, borderWidth: 1, borderColor: "#1A2540" },
  logoContainer: { flexDirection: "row", alignItems: "center", gap: 10 },
  logoIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#10B981", alignItems: "center", justifyContent: "center" },
  logoIcon: { fontSize: 18, color: "#050A14" },
  appName: { fontSize: 20, fontWeight: "700", color: "#FFFFFF", letterSpacing: -0.5 },
  card: { backgroundColor: "#0B1120", borderRadius: 24, borderWidth: 1, borderColor: "#1A2540", padding: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.5, shadowRadius: 40, elevation: 20 },
  cardTitle: { fontSize: 20, fontWeight: "700", color: "#FFFFFF", marginBottom: 6, letterSpacing: -0.3 },
  cardSubtitle: { fontSize: 13, color: "#4A5980", marginBottom: 24, lineHeight: 20 },
  fieldGroup: { marginBottom: 16 },
  fieldLabel: { fontSize: 11, fontWeight: "600", color: "#4A5980", marginBottom: 8, letterSpacing: 0.8, textTransform: "uppercase" },
  inputWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: "#0E1628", borderRadius: 12, borderWidth: 1, borderColor: "#1A2540", paddingHorizontal: 14, height: 50 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 14, color: "#FFFFFF", height: "100%" },
  eyeBtn: { paddingLeft: 8 },
  btnPrimary: { backgroundColor: "#10B981", borderRadius: 14, height: 54, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 10, shadowColor: "#10B981", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 10 },
  btnPrimaryText: { fontSize: 16, fontWeight: "700", color: "#050A14", letterSpacing: 0.2 },
  divider: { flexDirection: "row", alignItems: "center", marginVertical: 20, gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#1A2540" },
  dividerText: { fontSize: 13, color: "#2D3B55" },
  btnSecondary: { borderRadius: 14, height: 54, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#1A2540", backgroundColor: "transparent" },
  btnSecondaryText: { fontSize: 15, fontWeight: "600", color: "#7B8DB0" },
});