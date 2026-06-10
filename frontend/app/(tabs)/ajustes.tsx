import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

export default function AjustesScreen() {
  const router = useRouter();

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
            // Remove o token do cofre e joga o usuário pro início
            await SecureStore.deleteItemAsync('userToken');
            router.replace('/');
          }
        }
      ]
    );
  };

  // Componente reutilizável para as linhas do menu
  const MenuItem = ({ icon, title, subtitle, onPress, color = "#FFFFFF", danger = false }: any) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.menuLeft}>
        <View style={[styles.iconBox, danger && { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
          <Feather name={icon} size={20} color={danger ? "#EF4444" : "#10B981"} />
        </View>
        <View>
          <Text style={[styles.menuTitle, { color }]}>{title}</Text>
          {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <Feather name="chevron-right" size={20} color="#3D4A5C" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Cabeçalho do Perfil */}
        <View style={styles.header}>
          <Text style={styles.title}>Ajustes</Text>
          
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>L</Text> 
              {/* Depois podemos puxar a primeira letra do nome do usuário do banco */}
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>Lucca</Text>
              <Text style={styles.profileEmail}>Conta Premium</Text>
            </View>
            <TouchableOpacity style={styles.editProfileBtn}>
              <Feather name="edit-2" size={16} color="#10B981" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Seção: Personalização */}
        <Text style={styles.sectionTitle}>Personalização</Text>
        <View style={styles.sectionCard}>
          <MenuItem 
            icon="grid" 
            title="Categorias" 
            subtitle="Adicionar ou editar categorias de gastos"
            onPress={() => router.push('/categorias')}
          />
          <View style={styles.divider} />
          <MenuItem 
            icon="credit-card" 
            title="Contas Bancárias" 
            subtitle="Gerencie seus bancos e cartões"
            onPress={() => router.push('/contas')}
          />
        </View>

        {/* Seção: Preferências */}
        <Text style={styles.sectionTitle}>Preferências</Text>
        <View style={styles.sectionCard}>
          <MenuItem 
            icon="moon" 
            title="Tema do Aplicativo" 
            subtitle="Escuro (Padrão)"
            onPress={() => console.log('Mudar tema')}
          />
          <View style={styles.divider} />
          <MenuItem 
            icon="bell" 
            title="Notificações" 
            subtitle="Lembretes de vencimento"
            onPress={() => console.log('Ir para notificações')}
          />
        </View>

        {/* Seção: Conta */}
        <Text style={styles.sectionTitle}>Conta</Text>
        <View style={styles.sectionCard}>
          <MenuItem 
            icon="download-cloud" 
            title="Exportar Dados" 
            subtitle="Baixe um PDF do seu mês"
            onPress={() => console.log('Exportar')}
          />
          <View style={styles.divider} />
          <MenuItem 
            icon="log-out" 
            title="Sair da Conta" 
            danger={true}
            color="#EF4444"
            onPress={handleLogout}
          />
        </View>

        {/* Rodapé da versão */}
        <Text style={styles.versionText}>Vynce Finance • Versão 1.0.0</Text>
        
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050A14' },
  scroll: { paddingHorizontal: 24, paddingBottom: 100, paddingTop: 20 },
  header: { marginBottom: 32 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 24 },
  profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0B1120', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: '#1A2540' },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(16, 185, 129, 0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  avatarText: { fontSize: 24, fontWeight: 'bold', color: '#10B981' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 4 },
  profileEmail: { fontSize: 14, color: '#10B981', fontWeight: '500' },
  editProfileBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(16, 185, 129, 0.1)', alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#4A5980', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginLeft: 8 },
  sectionCard: { backgroundColor: '#0B1120', borderRadius: 20, borderWidth: 1, borderColor: '#1A2540', marginBottom: 28, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  menuLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(16, 185, 129, 0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  menuTitle: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  menuSubtitle: { fontSize: 12, color: '#4A5980' },
  divider: { height: 1, backgroundColor: '#1A2540', marginLeft: 72 },
  versionText: { textAlign: 'center', color: '#4A5980', fontSize: 12, marginTop: 20, marginBottom: 20 }
});