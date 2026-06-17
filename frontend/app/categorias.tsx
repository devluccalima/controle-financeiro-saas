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

const OPCOES_CORES = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4', '#EF4444', '#84CC16'];
const OPCOES_ICONES = ['tag', 'shopping-bag', 'coffee', 'briefcase', 'monitor', 'heart', 'home', 'gift', 'smartphone', 'book', 'activity',
                      'camera', 'credit-card', 'dollar-sign', 'film', 'headphones', 'key', 'lock', 'map', 'music', 'phone', 'search', 'settings',
                      'star', 'sun', 'umbrella', 'watch', 'wifi', 'zap'];

export default function CategoriasScreen() {
  const router = useRouter();
  const { colors, theme } = useTheme(); // <-- Captura o tema atual

  const [categorias, setCategorias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados do Modal
  const [modalVisivel, setModalVisivel] = useState(false);
  const [categoriaEditando, setCategoriaEditando] = useState<any>(null); 
  
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

  const abrirModalCriacao = () => {
    setCategoriaEditando(null);
    setNovaCategoriaNome('');
    setCorSelecionada(OPCOES_CORES[0]);
    setIconeSelecionado(OPCOES_ICONES[0]);
    setModalVisivel(true);
  };

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
        await api.put(`/categories/${categoriaEditando}`, dadosCategoria);
      } else {
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="arrow-left" size={24} color={colors.textMuted} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Minhas Categorias</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={categorias}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Feather name="grid" size={48} color={colors.border} />
              <Text style={[styles.emptyText, { color: colors.textDark }]}>Você ainda não possui categorias.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.categoryItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.categoryInfo}>
                <View style={[styles.iconBox, { backgroundColor: `${item.cor}20` }]}> 
                  <Feather name={item.icone || 'tag'} size={18} color={item.cor || colors.primary} />
                </View>
                <Text style={[styles.categoryName, { color: colors.text }]}>{item.nome}</Text>
              </View>
              
              <View style={styles.actionsBox}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => abrirModalEdicao(item)}>
                  <Feather name="edit-2" size={18} color={colors.textDark} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleExcluirCategoria(item.id, item.nome)}>
                  <Feather name="trash-2" size={18} color={colors.danger} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: colors.primary, shadowColor: colors.primary }]} 
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
                {categoriaEditando ? 'Editar Categoria' : 'Nova Categoria'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisivel(false)}>
                <Feather name="x" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              
              <Text style={[styles.inputLabel, { color: colors.textDark }]}>Nome</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                <Feather name={iconeSelecionado as any} size={20} color={corSelecionada} style={{ marginRight: 10 }} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Ex: Assinaturas"
                  placeholderTextColor={colors.textDark}
                  value={novaCategoriaNome}
                  onChangeText={setNovaCategoriaNome}
                />
              </View>

              <Text style={[styles.inputLabel, { color: colors.textDark }]}>Cor</Text>
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

              <Text style={[styles.inputLabel, { color: colors.textDark }]}>Ícone</Text>
              <View style={styles.optionsRow}>
                {OPCOES_ICONES.map(icone => (
                  <TouchableOpacity 
                    key={icone} 
                    style={[
                      styles.iconOption, 
                      { backgroundColor: colors.inputBg, borderColor: colors.border },
                      iconeSelecionado === icone && { borderColor: corSelecionada, backgroundColor: `${corSelecionada}15` }
                    ]}
                    onPress={() => setIconeSelecionado(icone)}
                  >
                    <Feather name={icone as any} size={20} color={iconeSelecionado === icone ? corSelecionada : colors.textMuted} />
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity 
                style={[styles.btnPrimary, { backgroundColor: corSelecionada, shadowColor: corSelecionada }]} 
                onPress={handleSalvarCategoria}
                disabled={salvando}
              >
                {salvando ? (
                  <ActivityIndicator color={theme === 'dark' ? '#050A14' : '#FFFFFF'} />
                ) : (
                  <Text style={[styles.btnPrimaryText, { color: theme === 'dark' ? '#050A14' : '#FFFFFF' }]}>Salvar Categoria</Text>
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
  categoryItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
  categoryInfo: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  categoryName: { fontSize: 16, fontWeight: '600' },
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
  iconOption: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  
  btnPrimary: { borderRadius: 16, height: 56, alignItems: 'center', justifyContent: 'center', marginTop: 32, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 8 },
  btnPrimaryText: { fontSize: 16, fontWeight: 'bold' },
});