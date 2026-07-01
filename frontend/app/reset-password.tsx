import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
    Alert
} from "react-native";
import { Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

import AnimatedBackground from '../components/AnimatedBackground'; // Ajuste o caminho se necessário

export default function ResetPasswordScreen() {
    const router = useRouter();
    
    // Captura o e-mail que passamos na tela anterior via parâmetro
    const { emailParam } = useLocalSearchParams(); 

    const [token, setToken] = useState("");
    const [novaSenha, setNovaSenha] = useState("");
    const [confirmarSenha, setConfirmarSenha] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleReset = async () => {
        if (!token || !novaSenha || !confirmarSenha) {
            Alert.alert("Atenção", "Por favor, preencha todos os campos.");
            return;
        }

        if (novaSenha !== confirmarSenha) {
            Alert.alert("Atenção", "As senhas não coincidem. Digite novamente.");
            return;
        }

        setIsLoading(true);

        try {
            // Lembre-se de colocar o SEU IP AQUI
            const response = await fetch('http://192.168.28.6:5000/auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: emailParam, // Usando o e-mail que veio da tela anterior
                    token: token,
                    nova_senha: novaSenha
                }),
            });

            const data = await response.json();

            if (response.ok) {
                Alert.alert("Sucesso!", data.mensagem);
                // Usa o 'replace' para ele não conseguir voltar para a tela de recuperar senha e ir direto pro Login
                router.replace('/login'); 
            } else {
                Alert.alert("Erro", data.erro || "Falha ao redefinir a senha.");
            }

        } catch (error) {
            console.error(error);
            Alert.alert("Erro", "Não foi possível conectar ao servidor. Tente novamente.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" backgroundColor="#050A14" />
            <AnimatedBackground />

            <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
                <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} disabled={isLoading}>
                            <Feather name="arrow-left" size={24} color="#7B8DB0" />
                        </TouchableOpacity>
                        <View style={styles.logoContainer}>
                            <View style={styles.logoIconBox}>
                                <Text style={styles.logoIcon}>◆</Text>
                            </View>
                            <Text style={styles.appName}>Vynce Finance</Text>
                        </View>
                    </View>

                    <View style={styles.card}>
                        <View style={styles.iconWrapper}>
                            <Feather name="lock" size={32} color="#10B981" />
                        </View>
                        <Text style={styles.cardTitle}>Criar nova senha</Text>
                        <Text style={styles.cardSubtitle}>
                            Digite o código de 6 dígitos que enviamos para o seu e-mail e crie sua nova senha.
                        </Text>

                        {/* CAMPO TOKEN */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>Código de Recuperação</Text>
                            <View style={styles.inputWrapper}>
                                <Feather name="hash" size={20} color="#4A5980" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Ex: 123456"
                                    placeholderTextColor="#3A4560"
                                    value={token}
                                    onChangeText={setToken}
                                    keyboardType="number-pad"
                                    maxLength={6}
                                    editable={!isLoading}
                                />
                            </View>
                        </View>

                        {/* CAMPO NOVA SENHA */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>Nova Senha</Text>
                            <View style={styles.inputWrapper}>
                                <Feather name="key" size={20} color="#4A5980" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Sua nova senha"
                                    placeholderTextColor="#3A4560"
                                    value={novaSenha}
                                    onChangeText={setNovaSenha}
                                    secureTextEntry
                                    editable={!isLoading}
                                />
                            </View>
                        </View>

                        {/* CAMPO CONFIRMAR SENHA */}
                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>Confirmar Nova Senha</Text>
                            <View style={styles.inputWrapper}>
                                <Feather name="check-circle" size={20} color="#4A5980" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Repita a senha"
                                    placeholderTextColor="#3A4560"
                                    value={confirmarSenha}
                                    onChangeText={setConfirmarSenha}
                                    secureTextEntry
                                    editable={!isLoading}
                                />
                            </View>
                        </View>

                        <TouchableOpacity 
                            style={styles.btnPrimary} 
                            onPress={handleReset} 
                            activeOpacity={0.85}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#050A14" />
                            ) : (
                                <>
                                    <Feather name="save" size={18} color="#050A14" />
                                    <Text style={styles.btnPrimaryText}>Salvar Nova Senha</Text>
                                </>
                            )}
                        </TouchableOpacity>

                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: "#050A14" },
    flex: { flex: 1 },
    scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 50, paddingBottom: 40 },
    header: { marginBottom: 24, flexDirection: "row", alignItems: "center" },
    backButton: { marginRight: 16, padding: 8, backgroundColor: "#0E1628", borderRadius: 12, borderWidth: 1, borderColor: "#1A2540" },
    logoContainer: { flexDirection: "row", alignItems: "center", gap: 10 },
    logoIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#10B981", alignItems: "center", justifyContent: "center" },
    logoIcon: { fontSize: 18, color: "#050A14" },
    appName: { fontSize: 20, fontWeight: "700", color: "#FFFFFF", letterSpacing: -0.5 },
    card: { backgroundColor: "#0B1120", borderRadius: 24, borderWidth: 1, borderColor: "#1A2540", padding: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.5, shadowRadius: 40, elevation: 20 },
    iconWrapper: { width: 64, height: 64, borderRadius: 32, backgroundColor: "rgba(16, 185, 129, 0.1)", justifyContent: "center", alignItems: "center", alignSelf: "center", marginBottom: 20 },
    cardTitle: { fontSize: 20, fontWeight: "700", color: "#FFFFFF", marginBottom: 6, letterSpacing: -0.3, textAlign: "center" },
    cardSubtitle: { fontSize: 13, color: "#4A5980", marginBottom: 24, lineHeight: 20, textAlign: "center" },
    fieldGroup: { marginBottom: 20 },
    fieldLabel: { fontSize: 11, fontWeight: "600", color: "#4A5980", marginBottom: 8, letterSpacing: 0.8, textTransform: "uppercase" },
    inputWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: "#0E1628", borderRadius: 12, borderWidth: 1, borderColor: "#1A2540", paddingHorizontal: 14, height: 50 },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, fontSize: 14, color: "#FFFFFF", height: "100%" },
    btnPrimary: { backgroundColor: "#10B981", borderRadius: 14, height: 54, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, shadowColor: "#10B981", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 10, marginTop: 10 },
    btnPrimaryText: { fontSize: 16, fontWeight: "700", color: "#050A14", letterSpacing: 0.2 },
});