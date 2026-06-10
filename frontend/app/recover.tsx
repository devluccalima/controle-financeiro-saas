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

import AnimatedBackground from '../components/AnimatedBackground';


// --- TELA DE RECUPERAÇÃO ---
export default function RecoverScreen() {
    const router = useRouter();
    const [email, setEmail] = useState("");

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

    const handleRecover = () => {
        if (!email) {
            alert("Por favor, digite seu e-mail.");
            return;
        }
        console.log("Enviando link de recuperação para:", email);
    };

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" backgroundColor="#050A14" />

            {/* Background */}
            <AnimatedBackground />

            <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
                <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

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

                    <Animated.View style={[styles.card, { transform: [{ translateY: cardAnim }], opacity: cardOpacity }]}>
                        <View style={styles.iconWrapper}>
                            <Feather name="key" size={32} color="#10B981" />
                        </View>
                        <Text style={styles.cardTitle}>Recuperar senha</Text>
                        <Text style={styles.cardSubtitle}>
                            Caso o e-mail esteja cadastrado, enviaremos as instruções de recuperação.
                        </Text>

                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>E-mail da Conta</Text>
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

                        <TouchableOpacity style={styles.btnPrimary} onPress={handleRecover} activeOpacity={0.85}>
                            <Feather name="send" size={18} color="#050A14" />
                            <Text style={styles.btnPrimaryText}>Enviar Link</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.btnSecondary} onPress={() => router.back()} activeOpacity={0.85}>
                            <Text style={styles.btnSecondaryText}>Cancelar</Text>
                        </TouchableOpacity>

                    </Animated.View>
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
    cardSubtitle: { fontSize: 13, color: "#4A5980", marginBottom: 28, lineHeight: 20, textAlign: "center" },
    fieldGroup: { marginBottom: 24 },
    fieldLabel: { fontSize: 11, fontWeight: "600", color: "#4A5980", marginBottom: 8, letterSpacing: 0.8, textTransform: "uppercase" },
    inputWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: "#0E1628", borderRadius: 12, borderWidth: 1, borderColor: "#1A2540", paddingHorizontal: 14, height: 50 },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, fontSize: 14, color: "#FFFFFF", height: "100%" },
    btnPrimary: { backgroundColor: "#10B981", borderRadius: 14, height: 54, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, shadowColor: "#10B981", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 10 },
    btnPrimaryText: { fontSize: 16, fontWeight: "700", color: "#050A14", letterSpacing: 0.2 },
    btnSecondary: { borderRadius: 14, height: 54, alignItems: "center", justifyContent: "center", marginTop: 12 },
    btnSecondaryText: { fontSize: 15, fontWeight: "600", color: "#7B8DB0" },
});