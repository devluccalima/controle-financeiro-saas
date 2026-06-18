import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert 
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { InternalBackground } from '../components/InternalBackground';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';

export default function PerfilScreen() {
  const router = useRouter();
  const { colors, theme } = useTheme();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  
  const [salvando, setSalvando] = useState(false);
  const [loadingContext, setLoadingContext] = useState(true);

  // 1. BUSCANDO OS DADOS ATUAIS AO ABRIR A TELA
  useEffect(() => {
    carregarPerfil();
  }, []);

  const carregarPerfil = async () => {
    try {
      const response = await api.get('/users/profile');
      setNome(response.data.nome);
      setEmail(response.data.email);
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
      Alert.alert('Erro', 'Não foi possível carregar seus dados no momento.');
    } finally {
      setLoadingContext(false);
    }
  };

  // 2. SALVANDO AS ALTERAÇÕES (CONECTADO COM O PUT)
  const handleSalvar = async () => {
    const payload: any = {};
    
    // Só envia o que realmente estiver preenchido
    if (nome.trim()) payload.nome = nome;
    if (email.trim()) payload.email = email;
    
    // Lógica de segurança para a senha
    if (novaSenha) {
      if (!senhaAtual) {
        Alert.alert('Atenção', 'Para definir uma nova senha, você precisa digitar a senha atual.');
        return;
      }
      payload.senha_atual = senhaAtual;
      payload.nova_senha = novaSenha;
    }

    if (Object.keys(payload).length === 0) {
      Alert.alert('Aviso', 'Nenhuma alteração foi preenchida.');
      return;
    }

    setSalvando(true);
    try {
      // Fazendo a requisição PUT para o backend
      await api.put('/users/profile', payload);
      
      Alert.alert('Sucesso', 'Seu perfil foi atualizado!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      const mensagemErro = error.response?.data?.erro || 'Não foi possível atualizar o perfil.';
      Alert.alert('Erro', mensagemErro);
    } finally {
      setSalvando(false);
    }
  };

  if (loadingContext) {
    return (
      <InternalBackground>
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </InternalBackground>
    );
  }

  return (
    <InternalBackground>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="arrow-left" size={24} color={colors.textMuted} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Editar Perfil</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
          
          {/* AVATAR GIGANTE PREENCHIDO DINAMICAMENTE */}
          <View style={styles.avatarContainer}>
            <View style={[styles.avatarGigante, { backgroundColor: `${colors.primary}20`, borderColor: colors.primary }]}>
              <Text style={[styles.avatarGiganteText, { color: colors.primary }]}>
                {nome ? nome.charAt(0).toUpperCase() : 'L'}
              </Text>
              <View style={[styles.avatarBadge, { backgroundColor: colors.primary }]}>
                <Feather name="camera" size={14} color={theme === 'dark' ? '#050A14' : '#FFFFFF'} />
              </View>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.textDark }]}>Dados Pessoais</Text>

          <Text style={[styles.label, { color: colors.textMuted }]}>Nome Completo</Text>
          <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="user" size={20} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput 
              style={[styles.inputText, { color: colors.text }]} 
              placeholder="Ex: Seu Nome Completo" 
              placeholderTextColor={colors.textDark} 
              value={nome} 
              onChangeText={setNome} 
            />
          </View>

          <Text style={[styles.label, { color: colors.textMuted }]}>E-mail de Acesso</Text>
          <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="mail" size={20} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput 
              style={[styles.inputText, { color: colors.text }]} 
              placeholder="Ex: seuemail@email.com" 
              placeholderTextColor={colors.textDark} 
              value={email} 
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <Text style={[styles.sectionTitle, { color: colors.textDark, marginTop: 16 }]}>Segurança</Text>

          <Text style={[styles.label, { color: colors.textMuted }]}>Senha Atual</Text>
          <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="lock" size={20} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput 
              style={[styles.inputText, { color: colors.text }]} 
              placeholder="Obrigatório apenas se for trocar a senha" 
              placeholderTextColor={colors.textDark} 
              value={senhaAtual} 
              onChangeText={setSenhaAtual}
              secureTextEntry
            />
          </View>

          <Text style={[styles.label, { color: colors.textMuted }]}>Nova Senha</Text>
          <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="key" size={20} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput 
              style={[styles.inputText, { color: colors.text }]} 
              placeholder="Digite a nova senha" 
              placeholderTextColor={colors.textDark} 
              value={novaSenha} 
              onChangeText={setNovaSenha}
              secureTextEntry
            />
          </View>

          {/* BOTÃO SALVAR */}
          <TouchableOpacity 
            style={[styles.submitButton, { backgroundColor: colors.primary }]} 
            onPress={handleSalvar} 
            activeOpacity={0.8}
            disabled={salvando}
          >
            {salvando ? (
              <ActivityIndicator color={theme === 'dark' ? '#050A14' : '#FFFFFF'} />
            ) : (
              <>
                <Text style={[styles.submitButtonText, { color: theme === 'dark' ? '#050A14' : '#FFFFFF' }]}>Salvar Alterações</Text>
                <Feather name="check" size={20} color={theme === 'dark' ? '#050A14' : '#FFFFFF'} />
              </>
            )}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </InternalBackground>
  );
}

const styles = StyleSheet.create({
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollPadding: { paddingHorizontal: 24, paddingBottom: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 20, paddingHorizontal: 24 },
  backButton: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  
  avatarContainer: { alignItems: 'center', marginBottom: 32, marginTop: 16 },
  avatarGigante: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  avatarGiganteText: { fontSize: 40, fontWeight: 'bold' },
  avatarBadge: { position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#050A14' },

  sectionTitle: { fontSize: 14, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, marginBottom: 20, paddingHorizontal: 16, height: 56 },
  inputIcon: { marginRight: 12 },
  inputText: { flex: 1, fontSize: 16, height: '100%' },

  submitButton: { flexDirection: 'row', borderRadius: 16, paddingVertical: 18, justifyContent: 'center', alignItems: 'center', marginTop: 16, gap: 12 },
  submitButtonText: { fontSize: 16, fontWeight: 'bold' },
});