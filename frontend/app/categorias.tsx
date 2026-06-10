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

const OPCOES_CORES = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4', '#EF4444', '#84CC16'];
const OPCOES_ICONES = ['tag', 'shopping-bag', 'coffee', 'briefcase', 'monitor', 'heart', 'home', 'car', 'gift', 'smartphone', 'book', 'activity'];

export default function CategoriasScreen() {
  const router = useRouter();
  const [categorias, setCategorias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados do Modal
  const [modalVisivel, setModalVisivel] = useState(false);
  const [categoriaEditando, setCategoriaEditando] = useState<any>(null); // NOVO: Guarda o ID se for edição
  
  const [novaCategoriaNome, setNovaCategoriaNome] = useState('');
  const [corSelecionada, setCorSelecionada] = useState(OPCOES_CORES[0]);
  const [iconeSelecionado, setIconeSelecionado] = useState(OPCOES_ICONES[0]);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    carregarCategorias();
  }, []);

  const carregarCategorias = async () => {
    try {
      const response = await api.get('/categories');
      setCategorias(response.data);
    } catch (error) {
      console.log('Erro ao buscar categorias', error);
    } finally {
      setLoading(false);
    }
  };

  // NOVO: Função para abrir o modal no modo de criação limpo
  const abrirModalCriacao = () => {
    setCategoriaEditando(null);
    setNovaCategoriaNome('');
    setCorSelecionada(OPCOES_CORES[0]);
    setIconeSelecionado(OPCOES_ICONES[0]);
    setModalVisivel(true);
  };

  // NOVO: Função para abrir o modal com os dados carregados
  const abrirModalEdicao = (categoria: any) => {
    setCategoriaEditando(categoria.id);
    setNovaCategoriaNome(categoria.nome);
    setCorSelecionada(categoria.cor || OPCOES_CORES[0]);
    setIconeSelecionado(categoria.icone || OPCOES_ICONES[0]);
    setModalVisivel(true);
  };

  const handleSalvarCategoria = async () => {
    if (!novaCategoriaNome.trim()) {
      Alert.alert('Atenção', 'Digite o nome da categoria.');
      return;
    }

    setSalvando(true);
    try {
      const dadosCategoria = {
        nome: novaCategoriaNome,
        icone: iconeSelecionado,
        cor: corSelecionada
      };

      if (categoriaEditando) {
        // Modo Edição (PUT)
        await api.put(`/categories/${categoriaEditando}`, dadosCategoria);
      } else {
        // Modo Criação (POST)
        await api.post('/categories', { ...dadosCategoria, tipo: 'despesa' });
      }
      
      setModalVisivel(false);
      carregarCategorias();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar a categoria.');
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluirCategoria = (id: string, nome: string) => {
    Alert.alert(
      "Excluir Categoria",
      `Tem certeza que deseja excluir "${nome}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Excluir", 
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/categories/${id}`);
              carregarCategorias();
            } catch (error) {
              Alert.alert('Erro', 'Verifique se há transações vinculadas a esta categoria.');
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
        <Text style={styles.title}>Minhas Categorias</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#10B981" />
        </View>
      ) : (
        <FlatList
          data={categorias}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Feather name="grid" size={48} color="#1A2540" />
              <Text style={styles.emptyText}>Você ainda não possui categorias.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.categoryItem}>
              <View style={styles.categoryInfo}>
                <View style={[styles.iconBox, { backgroundColor: `${item.cor}20` }]}> 
                  <Feather name={item.icone || 'tag'} size={18} color={item.cor || '#10B981'} />
                </View>
                <Text style={styles.categoryName}>{item.nome}</Text>
              </View>
              
              <View style={styles.actionsBox}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => abrirModalEdicao(item)}>
                  <Feather name="edit-2" size={18} color="#9CA3AF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleExcluirCategoria(item.id, item.nome)}>
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
                {categoriaEditando ? 'Editar Categoria' : 'Nova Categoria'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisivel(false)}>
                <Feather name="x" size={24} color="#7B8DB0" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              
              <Text style={styles.inputLabel}>Nome</Text>
              <View style={styles.inputWrapper}>
                <Feather name={iconeSelecionado as any} size={20} color={corSelecionada} style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Assinaturas"
                  placeholderTextColor="#3A4560"
                  value={novaCategoriaNome}
                  onChangeText={setNovaCategoriaNome}
                />
              </View>

              <Text style={styles.inputLabel}>Cor</Text>
              <View style={styles.optionsRow}>
                {OPCOES_CORES.map(cor => (
                  <TouchableOpacity 
                    key={cor} 
                    style={[styles.colorOption, { backgroundColor: cor }, corSelecionada === cor && styles.optionSelected]}
                    onPress={() => setCorSelecionada(cor)}
                  />
                ))}
              </View>

              <Text style={styles.inputLabel}>Ícone</Text>
              <View style={styles.optionsRow}>
                {OPCOES_ICONES.map(icone => (
                  <TouchableOpacity 
                    key={icone} 
                    style={[styles.iconOption, iconeSelecionado === icone && { borderColor: corSelecionada, backgroundColor: `${corSelecionada}15` }]}
                    onPress={() => setIconeSelecionado(icone)}
                  >
                    <Feather name={icone as any} size={20} color={iconeSelecionado === icone ? corSelecionada : '#4A5980'} />
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity 
                style={[styles.btnPrimary, { backgroundColor: corSelecionada, shadowColor: corSelecionada }]} 
                onPress={handleSalvarCategoria}
                disabled={salvando}
              >
                {salvando ? (
                  <ActivityIndicator color="#050A14" />
                ) : (
                  <Text style={styles.btnPrimaryText}>Salvar Categoria</Text>
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
  categoryItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0B1120', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#1A2540', marginBottom: 12 },
  categoryInfo: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  categoryName: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  actionsBox: { flexDirection: 'row', alignItems: 'center', gap: 12 }, // NOVO
  actionBtn: { padding: 4 }, // NOVO
  fab: { position: 'absolute', bottom: 30, right: 24, width: 60, height: 60, borderRadius: 30, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center', shadowColor: '#10B981', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 15, elevation: 10 },
  
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
  iconOption: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#0E1628', borderWidth: 1, borderColor: '#1A2540', alignItems: 'center', justifyContent: 'center' },
  
  btnPrimary: { borderRadius: 16, height: 56, alignItems: 'center', justifyContent: 'center', marginTop: 32, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 8 },
  btnPrimaryText: { fontSize: 16, fontWeight: 'bold', color: '#050A14' },
});