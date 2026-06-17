import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  TextInput, ActivityIndicator, Alert, Modal, 
  KeyboardAvoidingView, Platform, ScrollView 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext'; // <-- Importando o motor de temas

const OPCOES_CORES = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#64748B'];

export default function ContasScreen() {
  const router = useRouter();
  const { colors, theme } = useTheme(); // <-- Captura o tema atual

  const [contas, setContas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [modalVisivel, setModalVisivel] = useState(false);
  const [contaEditando, setContaEditando] = useState<any>(null);
  
  const [novaContaNome, setNovaContaNome] = useState('');
  const [corSelecionada, setCorSelecionada] = useState(OPCOES_CORES[0]);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    carregarContas();
  }, []);

  const carregarContas = async () => {
    try {
      const response = await api.get('/accounts'); 
      setContas(response.data);
    } catch (error) {
      console.log('Erro ao buscar contas', error);
    } finally {
      setLoading(false);
    }
  };

  const abrirModalCriacao = () => {
    setContaEditando(null);
    setNovaContaNome('');
    setCorSelecionada(OPCOES_CORES[0]);
    setModalVisivel(true);
  };

  const abrirModalEdicao = (conta: any) => {
    setContaEditando(conta.id);
    setNovaContaNome(conta.nome);
    setCorSelecionada(conta.cor || OPCOES_CORES[0]);
    setModalVisivel(true);
  };

  const handleSalvarConta = async () => {
    if (!novaContaNome.trim()) {
      Alert.alert('Atenção', 'Digite o nome da conta bancária.');
      return;
    }

    setSalvando(true);
    try {
      const dadosConta = {
        nome: novaContaNome,
        cor: corSelecionada
      };

      if (contaEditando) {
        await api.put(`/accounts/${contaEditando}`, dadosConta);
      } else {
        await api.post('/accounts', dadosConta);
      }
      
      setModalVisivel(false);
      carregarContas();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar a conta.');
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluirConta = (id: string, nome: string) => {
    Alert.alert(
      "Excluir Conta",
      `Tem certeza que deseja excluir a conta "${nome}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Excluir", 
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/accounts/${id}`);
              carregarContas();
            } catch (error) {
              Alert.alert('Erro', 'Verifique se há transações vinculadas a esta conta.');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="arrow-left" size={24} color={colors.textMuted} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Contas Bancárias</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={colors.secondary} />
        </View>
      ) : (
        <FlatList
          data={contas}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Feather name="credit-card" size={48} color={colors.border} />
              <Text style={[styles.emptyText, { color: colors.textDark }]}>Você ainda não possui contas cadastradas.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.accountItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.accountInfo}>
                <View style={[styles.iconBox, { backgroundColor: `${item.cor}20` }]}> 
                  <Feather name="credit-card" size={18} color={item.cor || colors.secondary} />
                </View>
                <Text style={[styles.accountName, { color: colors.text }]}>{item.nome}</Text>
              </View>
              
              <View style={styles.actionsBox}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => abrirModalEdicao(item)}>
                  <Feather name="edit-2" size={18} color={colors.textDark} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleExcluirConta(item.id, item.nome)}>
                  <Feather name="trash-2" size={18} color={colors.danger} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: colors.secondary, shadowColor: colors.secondary }]} 
        activeOpacity={0.8} 
        onPress={abrirModalCriacao}
      >
        <Feather name="plus" size={24} color={theme === 'dark' ? '#050A14' : '#FFFFFF'} />
      </TouchableOpacity>

      <Modal visible={modalVisivel} transparent animationType="slide">
        <KeyboardAvoidingView 
          style={[styles.modalOverlay, { backgroundColor: theme === 'dark' ? 'rgba(5, 10, 20, 0.8)' : 'rgba(0, 0, 0, 0.5)' }]} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {contaEditando ? 'Editar Conta' : 'Nova Conta'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisivel(false)}>
                <Feather name="x" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              
              <Text style={[styles.inputLabel, { color: colors.textDark }]}>Nome do Banco/Instituição</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                <Feather name="credit-card" size={20} color={corSelecionada} style={{ marginRight: 10 }} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Ex: Nubank, Itaú..."
                  placeholderTextColor={colors.textDark}
                  value={novaContaNome}
                  onChangeText={setNovaContaNome}
                />
              </View>

              <Text style={[styles.inputLabel, { color: colors.textDark }]}>Cor de Identificação</Text>
              <View style={styles.optionsRow}>
                {OPCOES_CORES.map(cor => (
                  <TouchableOpacity 
                    key={cor} 
                    style={[
                      styles.colorOption, 
                      { backgroundColor: cor }, 
                      corSelecionada === cor && [styles.optionSelected, { borderColor: colors.text }]
                    ]}
                    onPress={() => setCorSelecionada(cor)}
                  />
                ))}
              </View>

              <TouchableOpacity 
                style={[styles.btnPrimary, { backgroundColor: corSelecionada, shadowColor: corSelecionada }]} 
                onPress={handleSalvarConta}
                disabled={salvando}
              >
                {salvando ? (
                  <ActivityIndicator color={theme === 'dark' ? '#050A14' : '#FFFFFF'} />
                ) : (
                  <Text style={[styles.btnPrimaryText, { color: theme === 'dark' ? '#050A14' : '#FFFFFF' }]}>Salvar Conta</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingBottom: 20, paddingTop: 10 },
  backButton: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: 'bold' },
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContainer: { paddingHorizontal: 24, paddingBottom: 100 },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, marginTop: 16 },
  accountItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
  accountInfo: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  accountName: { fontSize: 16, fontWeight: '600' },
  actionsBox: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  actionBtn: { padding: 4 },
  fab: { position: 'absolute', bottom: 30, right: 24, width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 15, elevation: 10 },
  
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, borderWidth: 1, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  inputLabel: { fontSize: 12, fontWeight: '600', marginBottom: 12, marginTop: 16, textTransform: 'uppercase', letterSpacing: 0.8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, height: 56 },
  input: { flex: 1, fontSize: 16, height: '100%' },
  
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  colorOption: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: 'transparent' },
  optionSelected: { transform: [{ scale: 1.1 }] },
  
  btnPrimary: { borderRadius: 16, height: 56, alignItems: 'center', justifyContent: 'center', marginTop: 32, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 8 },
  btnPrimaryText: { fontSize: 16, fontWeight: 'bold' },
});