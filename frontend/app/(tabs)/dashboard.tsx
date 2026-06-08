import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { useRouter, useFocusEffect } from 'expo-router';
import { InternalBackground } from '../../components/InternalBackground'; // Ajuste o caminho se necessário
import api from '../../services/api'; // Ajuste o caminho se necessário

export default function DashboardScreen() {
  const router = useRouter();

  // 1. O MOTOR DO TEMPO (Começa no mês atual)
  const [dataFiltro, setDataFiltro] = useState(new Date());

  // Formata a data para exibir bonito (Ex: "Junho 2026")
  const nomeMes = dataFiltro.toLocaleDateString('pt-BR', { month: 'long' });
  const mesAtualFormatado = nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1) + ' ' + dataFiltro.getFullYear();

  // 2. ESTADOS FINANCEIOS
  const [receitas, setReceitas] = useState(0);
  const [despesas, setDespesas] = useState(0);
  const [saldoLivre, setSaldoLivre] = useState(0);
  const [transacoesRecentes, setTransacoesRecentes] = useState<any[]>([]);

  // 3. ESTADOS DO MODAL DE DETALHES
  const [modalDetalhesVisible, setModalDetalhesVisible] = useState(false);
  const [transacaoSelecionada, setTransacaoSelecionada] = useState<any>(null);

  // 4. ATUALIZAÇÃO DE DADOS (Dispara ao abrir a tela ou mudar de mês)
  useEffect(() => {
    carregarDashboard();
  }, [dataFiltro]);

  const carregarDashboard = async () => {
    try {
      const mes = dataFiltro.getMonth() + 1;
      const ano = dataFiltro.getFullYear();

      // Aqui estamos mandando o mês e ano para o Python filtrar
      const resumoResponse = await api.get(`/dashboard/resumo/?mes=${mes}&ano=${ano}`);
      setReceitas(resumoResponse.data.receitas || 0);
      setDespesas(resumoResponse.data.despesas || 0);
      setSaldoLivre(resumoResponse.data.saldo_livre || 0);

      const transacoesResponse = await api.get(`/transactions/?mes=${mes}&ano=${ano}`);
      setTransacoesRecentes(transacoesResponse.data || []);
      
    } catch (error) {
      console.error("Erro ao buscar dados do dashboard:", error);
    }
  };

  // Funções de Navegação de Tempo
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

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('userToken');
    router.replace('/');
  };

  const abrirDetalhes = (transacao: any) => {
    setTransacaoSelecionada(transacao);
    setModalDetalhesVisible(true);
  };

  return (
    <InternalBackground>
      <ScrollView contentContainerStyle={styles.scrollPadding} showsVerticalScrollIndicator={false}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <Feather name="user" size={20} color="#10B981" />
            </View>
            <View>
              <Text style={styles.greeting}>Olá, Lucca</Text>
              <Text style={styles.title}>Visão Geral</Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton} activeOpacity={0.7}>
            <Feather name="log-out" size={20} color="#4A5980" />
          </TouchableOpacity>
        </View>

        {/* SELETOR DE MÊS */}
        <View style={styles.monthSelector}>
          <TouchableOpacity style={styles.monthBtn} activeOpacity={0.7} onPress={() => mudarMes(-1)}>
            <Feather name="chevron-left" size={24} color="#7B8DB0" />
          </TouchableOpacity>
          <Text style={styles.monthText}>{mesAtualFormatado}</Text>
          <TouchableOpacity style={styles.monthBtn} activeOpacity={0.7} onPress={() => mudarMes(1)}>
            <Feather name="chevron-right" size={24} color="#7B8DB0" />
          </TouchableOpacity>
        </View>

        {/* CARDS DE RESUMO */}
        <View style={[styles.card, styles.heroCard]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconWrapperHero}>
              <Feather name="target" size={18} color="#10B981" />
            </View>
            <Text style={styles.heroLabel}>Saldo Livre Projetado</Text>
          </View>
          <Text style={styles.heroAmount}>{formatarMoeda(saldoLivre)}</Text>
          <Text style={styles.heroSubtext}>Restante após quitação de despesas previstas</Text>
        </View>

        <View style={styles.row}>
          <View style={[styles.card, styles.halfCard]}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconWrapper, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                <Feather name="arrow-up-right" size={16} color="#10B981" />
              </View>
              <Text style={styles.cardLabel}>Entradas</Text>
            </View>
            <Text style={styles.cardAmount}>{formatarMoeda(receitas)}</Text>
          </View>

          <View style={[styles.card, styles.halfCard]}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconWrapper, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                <Feather name="arrow-down-left" size={16} color="#EF4444" />
              </View>
              <Text style={styles.cardLabel}>Saídas</Text>
            </View>
            <Text style={styles.cardAmount}>{formatarMoeda(despesas)}</Text>
          </View>
        </View>

        {/* LISTA DINÂMICA DE LANÇAMENTOS RECENTES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lançamentos do Mês</Text>
          
          {transacoesRecentes.length === 0 ? (
            <Text style={styles.emptyText}>Nenhuma transação neste mês.</Text>
          ) : (
            transacoesRecentes.map((item) => (
              <TouchableOpacity 
                key={item.id} 
                style={styles.transactionItem} 
                activeOpacity={0.7}
                onPress={() => abrirDetalhes(item)}
              >
                <View style={styles.transactionLeft}>
                  <View style={[styles.transactionIcon, { backgroundColor: item.tipo === 'despesa' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)' }]}>
                    <Feather name={item.tipo === 'despesa' ? "shopping-bag" : "dollar-sign"} size={16} color={item.tipo === 'despesa' ? "#EF4444" : "#10B981"} />
                  </View>
                  <View>
                    <Text style={styles.transactionName}>{item.descricao}</Text>
                    {/* Se for parcelado, mostra a parcela atual e o total, senão só a categoria */}
                    <Text style={styles.transactionCategory}>
                      {item.categoria_nome} {item.total_parcelas > 1 ? `(${item.parcela_atual}/${item.total_parcelas})` : ''}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.transactionValue, { color: item.tipo === 'despesa' ? '#FFFFFF' : '#10B981' }]}>
                  {item.tipo === 'despesa' ? '- ' : '+ '}{formatarMoeda(item.valor)}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* BOTÃO FLUTUANTE DE NOVA TRANSAÇÃO */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.8} onPress={() => router.push('/nova-transacao')}>
        <Feather name="plus" size={32} color="#FFFFFF" />
      </TouchableOpacity>

      {/* MODAL DE DETALHES DA TRANSAÇÃO */}
      <Modal visible={modalDetalhesVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {transacaoSelecionada && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Detalhes do Lançamento</Text>
                  <TouchableOpacity onPress={() => setModalDetalhesVisible(false)} style={styles.modalCloseButton}>
                    <Feather name="x" size={24} color="#7B8DB0" />
                  </TouchableOpacity>
                </View>

                <View style={{ alignItems: 'center', marginBottom: 24 }}>
                  <Text style={styles.detailAmount}>
                    {transacaoSelecionada.tipo === 'despesa' ? '- ' : ''}{formatarMoeda(transacaoSelecionada.valor)}
                  </Text>
                  <Text style={styles.detailDesc}>{transacaoSelecionada.descricao}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Data</Text>
                  <Text style={styles.detailValue}>{formatarDataBR(transacaoSelecionada.data_vencimento)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Categoria</Text>
                  <Text style={styles.detailValue}>{transacaoSelecionada.categoria_nome}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Conta</Text>
                  <Text style={styles.detailValue}>{transacaoSelecionada.conta_nome}</Text>
                </View>
                {transacaoSelecionada.total_parcelas > 1 && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Parcelamento</Text>
                    <Text style={styles.detailValue}>{transacaoSelecionada.parcela_atual} de {transacaoSelecionada.total_parcelas}</Text>
                  </View>
                )}

                {/* Botões de Ação Futuros */}
                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.deleteButton}>
                    <Feather name="trash-2" size={20} color="#EF4444" />
                    <Text style={styles.deleteButtonText}>Excluir</Text>
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
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(16, 185, 129, 0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.2)' },
  greeting: { color: '#7B8DB0', fontSize: 13, marginBottom: 2 },
  title: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold', letterSpacing: -0.5 },
  logoutButton: { padding: 10, backgroundColor: '#0B1120', borderRadius: 12, borderWidth: 1, borderColor: '#1A2540' },
  monthSelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, backgroundColor: '#0B1120', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 16, borderWidth: 1, borderColor: '#1A2540' },
  monthBtn: { padding: 4 },
  monthText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  card: { backgroundColor: '#0B1120', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#1A2540', marginBottom: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  cardLabel: { color: '#7B8DB0', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  cardIconWrapper: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  heroCard: { borderColor: 'rgba(16, 185, 129, 0.3)', backgroundColor: '#0A141A' },
  cardIconWrapperHero: { width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(16, 185, 129, 0.1)', justifyContent: 'center', alignItems: 'center' },
  heroLabel: { color: '#10B981', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  heroAmount: { color: '#FFFFFF', fontSize: 36, fontWeight: 'bold', letterSpacing: -1, marginBottom: 4 },
  heroSubtext: { color: '#4A5980', fontSize: 12 },
  row: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  halfCard: { flex: 1, marginBottom: 0, padding: 16 },
  cardAmount: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold', letterSpacing: -0.5 },
  section: { marginTop: 8 },
  sectionTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '600', marginBottom: 16 },
  emptyText: { color: '#4A5980', fontSize: 14, textAlign: 'center', marginTop: 20, fontStyle: 'italic' },
  transactionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0B1120', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#1A2540', marginBottom: 12 },
  transactionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  transactionIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  transactionName: { color: '#FFFFFF', fontSize: 15, fontWeight: '600', marginBottom: 2 },
  transactionCategory: { color: '#4A5980', fontSize: 12 },
  transactionValue: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold' },
  fab: { position: 'absolute', bottom: 32, right: 24, width: 64, height: 64, borderRadius: 32, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center', shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8 },

  // Estilos do Modal de Detalhes
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#0B1120', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderWidth: 1, borderColor: '#1A2540', paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  modalCloseButton: { padding: 4 },
  detailAmount: { color: '#FFFFFF', fontSize: 32, fontWeight: 'bold', letterSpacing: -1 },
  detailDesc: { color: '#7B8DB0', fontSize: 16, marginTop: 4 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#1A2540' },
  detailLabel: { color: '#7B8DB0', fontSize: 15 },
  detailValue: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  modalActions: { marginTop: 32, alignItems: 'center' },
  deleteButton: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)', width: '100%', justifyContent: 'center' },
  deleteButtonText: { color: '#EF4444', fontSize: 16, fontWeight: 'bold' },
});