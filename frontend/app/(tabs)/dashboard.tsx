import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { InternalBackground } from '../../components/InternalBackground';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext'; // Importação do motor de temas




export default function DashboardScreen() {
  const router = useRouter();
  const { colors, theme } = useTheme(); // Captura a paleta de cores e o tema ativo

  // ESTADOS DE PERFIL (PARA EXIBIÇÃO NO HEADER)
  const [nome, setNome] = useState('');
  const [loadingContext, setLoadingContext] = useState(true);

  // 1. O MOTOR DO TEMPO
  const [dataFiltro, setDataFiltro] = useState(new Date());
  const [lastTap, setLastTap] = useState(0);

  const nomeMes = dataFiltro.toLocaleDateString('pt-BR', { month: 'long' });
  const mesAtualFormatado = nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1) + ' ' + dataFiltro.getFullYear();

  // 2. ESTADOS FINANCEIROS
  const [receitas, setReceitas] = useState(0);
  const [despesas, setDespesas] = useState(0);
  const [saldoLivre, setSaldoLivre] = useState(0);
  const [transacoesRecentes, setTransacoesRecentes] = useState<any[]>([]);

  // 3. ESTADOS DO MODAL DE DETALHES
  const [modalDetalhesVisible, setModalDetalhesVisible] = useState(false);
  const [transacaoSelecionada, setTransacaoSelecionada] = useState<any>(null);

  useEffect(() => {
    carregarPerfil();
  }, []);

  const carregarPerfil = async () => {
    try {
      const response = await api.get('/users/profile');
      setNome(response.data.nome);
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
      Alert.alert('Erro', 'Não foi possível carregar seus dados no momento.');
    } finally {
      setLoadingContext(false);
    }
  };

  useEffect(() => {
    carregarDashboard();
  }, [dataFiltro]);

  const carregarDashboard = async () => {
    try {
      const mes = dataFiltro.getMonth() + 1;
      const ano = dataFiltro.getFullYear();

      const resumoResponse = await api.get(`/dashboard/resumo/?mes=${mes}&ano=${ano}`);
      setReceitas(resumoResponse.data.receitas || 0);
      setDespesas(resumoResponse.data.despesas || 0);
      setSaldoLivre(resumoResponse.data.saldo || 0);

      const transacoesResponse = await api.get(`/transactions/?mes=${mes}&ano=${ano}&limit=10` // Pede apenas as 10 mais recentes
      );
      setTransacoesRecentes(transacoesResponse.data || []);

    } catch (error) {
      console.error("Erro ao buscar dados do dashboard:", error);
    }
  };

  const mudarMes = (delta: number) => {
    const novaData = new Date(dataFiltro);
    novaData.setMonth(novaData.getMonth() + delta);
    setDataFiltro(novaData);
  };

  const handleResetMes = () => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    if (now - lastTap < DOUBLE_PRESS_DELAY) {
      setDataFiltro(new Date());
    } else {
      setLastTap(now);
    }
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
              carregarDashboard();
            } catch (error) {
              console.error("Erro ao excluir:", error);
              Alert.alert("Erro", "Não foi possível excluir the lançamento.");
            }
          }
        }
      ]
    );
  };

  return (
    <InternalBackground>
      <ScrollView contentContainerStyle={styles.scrollPadding} showsVerticalScrollIndicator={false}>

        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.avatar, { borderColor: colors.primary + '30' }]}>
              <Feather name="user" size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.greeting, { color: colors.textMuted }]}>Olá, {nome}</Text>
              <Text style={[styles.title, { color: colors.text }]}>Visão Geral</Text>
            </View>
          </View>
        </View>

        {/* SELETOR DE MÊS */}
        <View style={[styles.monthSelector, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity style={styles.monthBtn} activeOpacity={0.7} onPress={() => mudarMes(-1)}>
            <Feather name="chevron-left" size={24} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={1} onPress={handleResetMes}>
            <Text style={[styles.monthText, { color: colors.text }]}>{mesAtualFormatado}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.monthBtn} activeOpacity={0.7} onPress={() => mudarMes(1)}>
            <Feather name="chevron-right" size={24} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* CARDS DE RESUMO */}
        <View style={[
          styles.card,
          styles.heroCard,
          { backgroundColor: theme === 'dark' ? '#0A141A' : colors.primary + '10' }
        ]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconWrapperHero, { backgroundColor: colors.primary + '15' }]}>
              <Feather name="target" size={18} color={colors.primary} />
            </View>
            <Text style={[styles.heroLabel, { color: colors.primary }]}>Saldo Livre Projetado</Text>
          </View>
          <Text style={[styles.heroAmount, { color: colors.text }]}>{formatarMoeda(saldoLivre)}</Text>
          <Text style={[styles.heroSubtext, { color: colors.textDark }]}>Restante após quitação de despesas previstas</Text>
        </View>

        <View style={styles.row}>
          <View style={[styles.card, styles.halfCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconWrapper, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                <Feather name="arrow-up-right" size={16} color={colors.primary} />
              </View>
              <Text style={[styles.cardLabel, { color: colors.textMuted }]}>Entradas</Text>
            </View>
            <Text style={[styles.cardAmount, { color: colors.text }]}>{formatarMoeda(receitas)}</Text>
          </View>

          <View style={[styles.card, styles.halfCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconWrapper, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                <Feather name="arrow-down-left" size={16} color={colors.danger} />
              </View>
              <Text style={[styles.cardLabel, { color: colors.textMuted }]}>Saídas</Text>
            </View>
            <Text style={[styles.cardAmount, { color: colors.text }]}>{formatarMoeda(despesas)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>Últimos Lançamentos</Text>

            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', padding: 4 }}
              onPress={() => router.push('/extrato')}
              activeOpacity={0.7}
            >
              <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '600', marginRight: 4 }}>Ver todos</Text>
              <Feather name="chevron-right" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {transacoesRecentes.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textDark }]}>Nenhuma transação neste mês.</Text>
          ) : (
            transacoesRecentes.map((item) => (
              <TouchableOpacity
                key={item.id}
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
                    <Text
                      style={[styles.transactionName, { color: colors.text }]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {item.descricao}
                    </Text>
                    <Text style={[styles.transactionCategory, { color: colors.textDark }]}>
                      {item.categoria_nome} | {item.total_parcelas > 1 ? `(${item.parcela_atual}/${item.total_parcelas})` : ''}
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
            ))
          )}
        </View>
      </ScrollView>

      {/* BOTÃO FLUTUANTE */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        activeOpacity={0.8}
        onPress={() => router.push('/nova-transacao')}
      >
        <Feather name="plus" size={32} color="#050A14" />
        {/* Mantido o fundo escuro fixo no ícone do botão para contrastar com o verde vibrante */}
      </TouchableOpacity>

      {/* MODAL DE DETALHES */}
      <Modal visible={modalDetalhesVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {transacaoSelecionada && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>Detalhes do Lançamento</Text>
                  <TouchableOpacity onPress={() => setModalDetalhesVisible(false)} style={styles.modalCloseButton}>
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

                {/* BOTÕES DE AÇÃO */}
                <View style={styles.modalActionsRow}>
                  <TouchableOpacity style={styles.editButton} onPress={() => handleEditar(transacaoSelecionada)}>
                    <Feather name="edit-2" size={18} color={colors.primary} />
                    <Text style={[styles.editButtonText, { color: colors.primary }]}>Editar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.deleteButton} onPress={() => handleExcluir(transacaoSelecionada.id)}>
                    <Feather name="trash-2" size={18} color={colors.danger} />
                    <Text style={[styles.deleteButtonText, { color: colors.danger }]}>Excluir</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

    </InternalBackground>
  );
}

const styles = StyleSheet.create({
  scrollPadding: { paddingTop: 20, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(16, 185, 129, 0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  greeting: { fontSize: 13, marginBottom: 2 },
  title: { fontSize: 20, fontWeight: 'bold', letterSpacing: -0.5 },
  logoutButton: { padding: 10, borderRadius: 12, borderWidth: 1 },
  monthSelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 16, borderWidth: 1 },
  monthBtn: { padding: 4 },
  monthText: { fontSize: 16, fontWeight: '600' },
  card: { borderRadius: 20, padding: 20, borderWidth: 1, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  cardLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  cardIconWrapper: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  heroCard: { borderColor: 'rgba(16, 185, 129, 0.3)' },
  cardIconWrapperHero: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  heroLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  heroAmount: { fontSize: 36, fontWeight: 'bold', letterSpacing: -1, marginBottom: 4 },
  heroSubtext: { fontSize: 12 },
  row: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  halfCard: { flex: 1, marginBottom: 0, padding: 16 },
  cardAmount: { fontSize: 20, fontWeight: 'bold', letterSpacing: -0.5 },
  section: { marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
  emptyText: { fontSize: 14, textAlign: 'center', marginTop: 20, fontStyle: 'italic' },
  transactionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
  transactionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  transactionIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  transactionName: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  transactionCategory: { fontSize: 12 },
  transactionValue: { fontSize: 15, fontWeight: 'bold', minWidth: 80 },
  fab: { position: 'absolute', bottom: 32, right: 24, width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderWidth: 1, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  modalCloseButton: { padding: 4 },
  detailAmount: { fontSize: 32, fontWeight: 'bold', letterSpacing: -1 },
  detailDesc: { fontSize: 16, marginTop: 4 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1 },
  detailLabel: { fontSize: 15 },
  detailValue: { fontSize: 15, fontWeight: '600' },

  modalActionsRow: { flexDirection: 'row', marginTop: 32, gap: 12, width: '100%' },
  editButton: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)', justifyContent: 'center' },
  editButtonText: { fontSize: 16, fontWeight: 'bold' },
  deleteButton: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)', justifyContent: 'center' },
  deleteButtonText: { fontSize: 16, fontWeight: 'bold' },
});