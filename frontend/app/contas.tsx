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

const OPCOES_CORES = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#64748B'];

export default function ContasScreen() {
  const router = useRouter();
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
      const response = await api.get('/accounts'); // Confirme se a rota no Flask é essa mesma
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
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#7B8DB0" />
        </TouchableOpacity>
        <Text style={styles.title}>Contas Bancárias</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : (
        <FlatList
          data={contas}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Feather name="credit-card" size={48} color="#1A2540" />
              <Text style={styles.emptyText}>Você ainda não possui contas cadastradas.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.accountItem}>
              <View style={styles.accountInfo}>
                <View style={[styles.iconBox, { backgroundColor: `${item.cor}20` }]}> 
                  <Feather name="credit-card" size={18} color={item.cor || '#3B82F6'} />
                </View>
                <Text style={styles.accountName}>{item.nome}</Text>
              </View>
              
              <View style={styles.actionsBox}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => abrirModalEdicao(item)}>
                  <Feather name="edit-2" size={18} color="#9CA3AF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleExcluirConta(item.id, item.nome)}>
                  <Feather name="trash-2" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      <TouchableOpacity style={styles.fab} activeOpacity={0.8} onPress={abrirModalCriacao}>
        <Feather name="plus" size={24} color="#050A14" />
      </TouchableOpacity>

      <Modal visible={modalVisivel} transparent animationType="slide">
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {contaEditando ? 'Editar Conta' : 'Nova Conta'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisivel(false)}>
                <Feather name="x" size={24} color="#7B8DB0" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              
              <Text style={styles.inputLabel}>Nome do Banco/Instituição</Text>
              <View style={styles.inputWrapper}>
                <Feather name="credit-card" size={20} color={corSelecionada} style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Nubank, Itaú..."
                  placeholderTextColor="#3A4560"
                  value={novaContaNome}
                  onChangeText={setNovaContaNome}
                />
              </View>

              <Text style={styles.inputLabel}>Cor de Identificação</Text>
              <View style={styles.optionsRow}>
                {OPCOES_CORES.map(cor => (
                  <TouchableOpacity 
                    key={cor} 
                    style={[styles.colorOption, { backgroundColor: cor }, corSelecionada === cor && styles.optionSelected]}
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
                  <ActivityIndicator color="#050A14" />
                ) : (
                  <Text style={styles.btnPrimaryText}>Salvar Conta</Text>
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
  container: { flex: 1, backgroundColor: '#050A14' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingBottom: 20, paddingTop: 10 },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#0E1628', borderWidth: 1, borderColor: '#1A2540', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' },
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContainer: { paddingHorizontal: 24, paddingBottom: 100 },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyText: { color: '#4A5980', fontSize: 16, marginTop: 16 },
  accountItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0B1120', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#1A2540', marginBottom: 12 },
  accountInfo: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  accountName: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  actionsBox: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  actionBtn: { padding: 4 },
  fab: { position: 'absolute', bottom: 30, right: 24, width: 60, height: 60, borderRadius: 30, backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center', shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 15, elevation: 10 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(5, 10, 20, 0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#0B1120', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, borderWidth: 1, borderColor: '#1A2540', maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' },
  inputLabel: { fontSize: 12, fontWeight: '600', color: '#4A5980', marginBottom: 12, marginTop: 16, textTransform: 'uppercase', letterSpacing: 0.8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0E1628', borderRadius: 16, borderWidth: 1, borderColor: '#1A2540', paddingHorizontal: 16, height: 56 },
  input: { flex: 1, fontSize: 16, color: '#FFFFFF', height: '100%' },
  
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  colorOption: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: 'transparent' },
  optionSelected: { borderColor: '#FFFFFF', transform: [{ scale: 1.1 }] },
  
  btnPrimary: { borderRadius: 16, height: 56, alignItems: 'center', justifyContent: 'center', marginTop: 32, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 8 },
  btnPrimaryText: { fontSize: 16, fontWeight: 'bold', color: '#050A14' },
});