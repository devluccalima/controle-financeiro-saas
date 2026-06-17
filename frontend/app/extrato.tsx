import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, FlatList, 
  TextInput, ActivityIndicator, Modal, Alert, ScrollView 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';

export default function ExtratoScreen() {
  const router = useRouter();
  const { colors, theme } = useTheme();

  // 1. ESTADOS DE DADOS
  const [loading, setLoading] = useState(true);
  const [transacoes, setTransacoes] = useState<any[]>([]);
  const [transacoesFiltradas, setTransacoesFiltradas] = useState<any[]>([]);

  // 2. ESTADOS DE FILTRO E PESQUISA
  const [dataFiltro, setDataFiltro] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'receita' | 'despesa'>('todos');

  // 3. ESTADOS DO MODAL DE DETALHES
  const [modalDetalhesVisible, setModalDetalhesVisible] = useState(false);
  const [transacaoSelecionada, setTransacaoSelecionada] = useState<any>(null);

  const nomeMes = dataFiltro.toLocaleDateString('pt-BR', { month: 'long' });
  const mesAtualFormatado = nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1) + ' ' + dataFiltro.getFullYear();

  // Buscar dados sempre que o mês/ano mudar ou a tela ganhar foco
  useFocusEffect(
    useCallback(() => {
      buscarTransacoes();
    }, [dataFiltro])
  );

  const buscarTransacoes = async () => {
    setLoading(true);
    try {
      const mes = dataFiltro.getMonth() + 1;
      const ano = dataFiltro.getFullYear();

      // Chamada sem limit, trazemos todas do mês
      const response = await api.get(`/transactions/`, {
        params: { mes, ano }
      });
      
      setTransacoes(response.data || []);
    } catch (error) {
      console.error("Erro ao buscar extrato:", error);
    } finally {
      setLoading(false);
    }
  };

  // Motor de filtragem local (Reage a digitação e cliques nos botões de receita/despesa)
  useEffect(() => {
    let resultado = transacoes;

    // Filtra por Receita / Despesa
    if (filtroTipo !== 'todos') {
      resultado = resultado.filter(t => t.tipo === filtroTipo);
    }

    // Filtra pelo texto digitado (Descrição, Categoria ou Data)
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      resultado = resultado.filter(t => 
        t.descricao.toLowerCase().includes(query) ||
        t.categoria_nome.toLowerCase().includes(query) ||
        formatarDataBR(t.data_vencimento).includes(query)
      );
    }

    setTransacoesFiltradas(resultado);
  }, [searchQuery, filtroTipo, transacoes]);

  const mudarMes = (delta: number) => {
    const novaData = new Date(dataFiltro);
    novaData.setMonth(novaData.getMonth() + delta);
    setDataFiltro(novaData);
  };

  const formatarMoeda = (valor: number) => {
    return `R$ ${parseFloat(String(valor)).toFixed(2).replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.')}`;
  };

  const formatarDataBR = (dataIso: string) => {
    if (!dataIso) return '';
    const date = new Date(dataIso);
    return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  };

  const abrirDetalhes = (transacao: any) => {
    setTransacaoSelecionada(transacao);
    setModalDetalhesVisible(true);
  };

  const handleEditar = (transacao: any) => {
    setModalDetalhesVisible(false);
    router.push({ pathname: '/nova-transacao', params: { id: transacao.id } });
  };

  const handleExcluir = async (id: string) => {
    Alert.alert(
      "Excluir Lançamento",
      "Tem certeza que deseja apagar essa transação?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/transactions/${id}`);
              setModalDetalhesVisible(false);
              buscarTransacoes(); 
            } catch (error) {
              Alert.alert("Erro", "Não foi possível excluir o lançamento.");
            }
          }
        }
      ]
    );
  };

  // Componente que renderiza cada item da lista
  const renderTransacao = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.transactionItem, { backgroundColor: colors.card, borderColor: colors.border }]}
      activeOpacity={0.7}
      onPress={() => abrirDetalhes(item)}
    >
      <View style={[styles.transactionLeft, { flex: 1, marginRight: 12 }]}>
        <View style={[
          styles.transactionIcon,
          { backgroundColor: item.categoria_cor ? `${item.categoria_cor}20` : (item.tipo === 'despesa' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)') }
        ]}>
          <Feather
            name={item.categoria_icone || (item.tipo === 'despesa' ? "shopping-bag" : "dollar-sign")}
            size={16}
            color={item.categoria_cor || (item.tipo === 'despesa' ? colors.danger : colors.primary)}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.transactionName, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">
            {item.descricao}
          </Text>
          <Text style={[styles.transactionCategory, { color: colors.textDark }]}>
            {item.categoria_nome} • {formatarDataBR(item.data_vencimento)}
          </Text>
        </View>
      </View>

      <Text style={[
        styles.transactionValue,
        { color: item.tipo === 'despesa' ? colors.text : colors.primary, flexShrink: 0 }
      ]}>
        {item.tipo === 'despesa' ? '- ' : '+ '}{formatarMoeda(item.valor)}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      
      {/* HEADER E VOLTAR */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="arrow-left" size={24} color={colors.textMuted} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Extrato Completo</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* SELETOR DE MÊS */}
      <View style={{ paddingHorizontal: 24, marginBottom: 16 }}>
        <View style={[styles.monthSelector, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity style={styles.monthBtn} activeOpacity={0.7} onPress={() => mudarMes(-1)}>
            <Feather name="chevron-left" size={24} color={colors.textMuted} />
          </TouchableOpacity>
          <Text style={[styles.monthText, { color: colors.text }]}>{mesAtualFormatado}</Text>
          <TouchableOpacity style={styles.monthBtn} activeOpacity={0.7} onPress={() => mudarMes(1)}>
            <Feather name="chevron-right" size={24} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* BARRA DE PESQUISA */}
      <View style={{ paddingHorizontal: 24, marginBottom: 16 }}>
        <View style={[styles.searchContainer, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
          <Feather name="search" size={20} color={colors.textDark} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Pesquisar nome, data ou categoria..."
            placeholderTextColor={colors.textDark}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
              <Feather name="x-circle" size={18} color={colors.textDark} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* CHIPS DE FILTRO (TODOS | RECEITAS | DESPESAS) */}
      <View style={styles.filterTabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}>
          <TouchableOpacity 
            style={[styles.filterChip, filtroTipo === 'todos' ? { backgroundColor: colors.primary, borderColor: colors.primary } : { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setFiltroTipo('todos')}
          >
            <Text style={[styles.filterChipText, { color: filtroTipo === 'todos' ? (theme === 'dark' ? '#050A14' : '#FFFFFF') : colors.textMuted }]}>Todos</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.filterChip, filtroTipo === 'receita' ? { backgroundColor: colors.primary, borderColor: colors.primary } : { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setFiltroTipo('receita')}
          >
            <Text style={[styles.filterChipText, { color: filtroTipo === 'receita' ? (theme === 'dark' ? '#050A14' : '#FFFFFF') : colors.textMuted }]}>Entradas</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.filterChip, filtroTipo === 'despesa' ? { backgroundColor: colors.danger, borderColor: colors.danger } : { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setFiltroTipo('despesa')}
          >
            <Text style={[styles.filterChipText, { color: filtroTipo === 'despesa' ? '#FFFFFF' : colors.textMuted }]}>Saídas</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* LISTA DE TRANSAÇÕES */}
      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={transacoesFiltradas}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listPadding}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Feather name="search" size={40} color={colors.border} />
              <Text style={[styles.emptyText, { color: colors.textDark }]}>Nenhum lançamento encontrado.</Text>
            </View>
          }
          renderItem={renderTransacao}
        />
      )}

      {/* MODAL DE DETALHES (Reutilizado do Dashboard) */}
      <Modal visible={modalDetalhesVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {transacaoSelecionada && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>Detalhes do Lançamento</Text>
                  <TouchableOpacity onPress={() => setModalDetalhesVisible(false)} style={{ padding: 4 }}>
                    <Feather name="x" size={24} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>

                <View style={{ alignItems: 'center', marginBottom: 24 }}>
                  <Text style={[styles.detailAmount, { color: colors.text }]}>
                    {transacaoSelecionada.tipo === 'despesa' ? '- ' : ''}{formatarMoeda(transacaoSelecionada.valor)}
                  </Text>
                  <Text style={[styles.detailDesc, { color: colors.textMuted }]}>{transacaoSelecionada.descricao}</Text>
                </View>

                <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Data</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{formatarDataBR(transacaoSelecionada.data_vencimento)}</Text>
                </View>
                <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Categoria</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{transacaoSelecionada.categoria_nome}</Text>
                </View>
                <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Conta</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{transacaoSelecionada.conta_nome}</Text>
                </View>
                {transacaoSelecionada.total_parcelas > 1 && (
                  <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Parcelamento</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>{transacaoSelecionada.parcela_atual} de {transacaoSelecionada.total_parcelas}</Text>
                  </View>
                )}

                <View style={styles.modalActionsRow}>
                  <TouchableOpacity style={[styles.editButton, { backgroundColor: `${colors.primary}1A`, borderColor: `${colors.primary}4D` }]} onPress={() => handleEditar(transacaoSelecionada)}>
                    <Feather name="edit-2" size={18} color={colors.primary} />
                    <Text style={[styles.editButtonText, { color: colors.primary }]}>Editar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.deleteButton, { backgroundColor: `${colors.danger}1A`, borderColor: `${colors.danger}4D` }]} onPress={() => handleExcluir(transacaoSelecionada.id)}>
                    <Feather name="trash-2" size={18} color={colors.danger} />
                    <Text style={[styles.deleteButtonText, { color: colors.danger }]}>Excluir</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 10, paddingHorizontal: 24 },
  backButton: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  monthSelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 16, borderWidth: 1 },
  monthBtn: { padding: 4 },
  monthText: { fontSize: 16, fontWeight: '600' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, height: 50 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15, height: '100%' },
  filterTabsContainer: { marginBottom: 16 },
  filterChip: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  filterChipText: { fontSize: 14, fontWeight: '600' },
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listPadding: { paddingHorizontal: 24, paddingBottom: 100 },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyText: { fontSize: 15, marginTop: 16 },
  transactionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
  transactionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  transactionIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  transactionName: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  transactionCategory: { fontSize: 12 },
  transactionValue: { fontSize: 15, fontWeight: 'bold', minWidth: 80 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderWidth: 1, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  detailAmount: { fontSize: 32, fontWeight: 'bold', letterSpacing: -1 },
  detailDesc: { fontSize: 16, marginTop: 4 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1 },
  detailLabel: { fontSize: 15 },
  detailValue: { fontSize: 15, fontWeight: '600' },
  modalActionsRow: { flexDirection: 'row', marginTop: 32, gap: 12, width: '100%' },
  editButton: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, borderRadius: 12, borderWidth: 1, justifyContent: 'center' },
  editButtonText: { fontSize: 16, fontWeight: 'bold' },
  deleteButton: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, borderRadius: 12, borderWidth: 1, justifyContent: 'center' },
  deleteButtonText: { fontSize: 16, fontWeight: 'bold' },
});