import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useTheme } from '../../context/ThemeContext'; // <-- Importando o motor de temas

export default function AjustesScreen() {
  const router = useRouter();
  const { theme, colors, toggleTheme } = useTheme(); // <-- Puxando tema, cores e a função de trocar

  const handleLogout = () => {
    Alert.alert(
      "Sair da conta",
      "Tem certeza que deseja sair do aplicativo?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sair",
          style: "destructive",
          onPress: async () => {
            await SecureStore.deleteItemAsync('userToken');
            router.replace('/');
          }
        }
      ]
    );
  };

  // Componente reutilizável limpo e dinâmico
  const MenuItem = ({ icon, title, subtitle, onPress, danger = false }: any) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.menuLeft}>
        <View style={[
          styles.iconBox,
          { backgroundColor: danger ? `${colors.danger}1A` : `${colors.primary}1A` }
        ]}>
          <Feather name={icon} size={20} color={danger ? colors.danger : colors.primary} />
        </View>
        <View>
          <Text style={[styles.menuTitle, { color: danger ? colors.danger : colors.text }]}>{title}</Text>
          {subtitle && <Text style={[styles.menuSubtitle, { color: colors.textMuted }]}>{subtitle}</Text>}
        </View>
      </View>
      <Feather name="chevron-right" size={20} color={colors.textDark} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Cabeçalho do Perfil */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Ajustes</Text>

          <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.avatar, { backgroundColor: `${colors.primary}20` }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>L</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.text }]}>Lucca</Text>
              <Text style={[styles.profileEmail, { color: colors.primary }]}>Conta Premium</Text>
            </View>
            <TouchableOpacity style={[styles.editProfileBtn, { backgroundColor: `${colors.primary}1A` }]}
              onPress={() => router.push('/perfil')}>
              <Feather name="edit-2" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Seção: Personalização */}
        <Text style={[styles.sectionTitle, { color: colors.textDark }]}>Personalização</Text>
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MenuItem
            icon="grid"
            title="Categorias"
            subtitle="Adicionar ou editar categorias de gastos"
            onPress={() => router.push('/categorias')}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <MenuItem
            icon="credit-card"
            title="Contas Bancárias"
            subtitle="Gerencie seus bancos e cartões"
            onPress={() => router.push('/contas')}
          />
        </View>

        {/* Seção: Preferências */}
        <Text style={[styles.sectionTitle, { color: colors.textDark }]}>Preferências</Text>
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MenuItem
            icon={theme === 'dark' ? "moon" : "sun"}
            title="Tema do Aplicativo"
            subtitle={theme === 'dark' ? "Escuro (Atual)" : "Claro (Atual)"}
            onPress={toggleTheme}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <MenuItem
            icon="bell"
            title="Notificações"
            subtitle="Lembretes de vencimento"
            onPress={() => console.log('Ir para notificações')}
          />
        </View>

        {/* Seção: Conta */}
        <Text style={[styles.sectionTitle, { color: colors.textDark }]}>Conta</Text>
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MenuItem
            icon="download-cloud"
            title="Exportar Dados"
            subtitle="Baixe um PDF do seu mês"
            onPress={() => console.log('Exportar')}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <MenuItem
            icon="log-out"
            title="Sair da Conta"
            danger={true}
            onPress={handleLogout}
          />
        </View>

        {/* Rodapé da versão */}
        <Text style={[styles.versionText, { color: colors.textDark }]}>Vynce Finance • Versão 1.0.0</Text>

      </ScrollView>
    </SafeAreaView>
  );
}

// O StyleSheet agora cuida apenas de espaçamentos, flexbox e dimensões!
const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 24, paddingBottom: 100, paddingTop: 20 },
  header: { marginBottom: 32 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 24 },
  profileCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, borderWidth: 1 },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  avatarText: { fontSize: 24, fontWeight: 'bold' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  profileEmail: { fontSize: 14, fontWeight: '500' },
  editProfileBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 14, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginLeft: 8 },
  sectionCard: { borderRadius: 20, borderWidth: 1, marginBottom: 28, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  menuLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  menuTitle: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  menuSubtitle: { fontSize: 12 },
  divider: { height: 1, marginLeft: 72 },
  versionText: { textAlign: 'center', fontSize: 12, marginTop: 20, marginBottom: 20 }
});