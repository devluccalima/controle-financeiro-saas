import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { PieChart } from 'react-native-gifted-charts';
import { useFocusEffect } from 'expo-router';

import api from '../../services/api'; // Ajuste o caminho se necessário

// Paleta de cores para as categorias (combinam com o Dark Mode)
const CORES = [
  '#10B981', // Verde Esmeralda
  '#3B82F6', // Azul
  '#8B5CF6', // Roxo
  '#F59E0B', // Laranja
  '#EC4899', // Rosa
  '#06B6D4', // Ciano
  '#EF4444', // Vermelho
  '#84CC16', // Verde Lima
];

export default function RelatoriosScreen() {
  const [loading, setLoading] = useState(true);
  const [dados, setDados] = useState<any[]>([]);
  const [totalGeral, setTotalGeral] = useState(0);
  
  // Controle de Mês e Ano atual
  const [mesAtual, setMesAtual] = useState(new Date().getMonth() + 1);
  const [anoAtual, setAnoAtual] = useState(new Date().getFullYear());

  const mesesNome = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const carregarRelatorio = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/transactions/relatorios/categorias`, {
        params: { mes: mesAtual, ano: anoAtual, tipo: 'despesa' }
      });
      setDados(response.data.dados);
      setTotalGeral(response.data.total_geral);
    } catch (error) {
      console.log("Erro ao carregar relatórios:", error);
    } finally {
      setLoading(false);
    }
  };

  // Recarrega sempre que a tela ganha foco ou o mês/ano muda
  useFocusEffect(
    useCallback(() => {
      carregarRelatorio();
    }, [mesAtual, anoAtual])
  );

  const mudarMes = (direcao: 'anterior' | 'proximo') => {
    if (direcao === 'anterior') {
      if (mesAtual === 1) {
        setMesAtual(12);
        setAnoAtual(anoAtual - 1);
      } else {
        setMesAtual(mesAtual - 1);
      }
    } else {
      if (mesAtual === 12) {
        setMesAtual(1);
        setAnoAtual(anoAtual + 1);
      } else {
        setMesAtual(mesAtual + 1);
      }
    }
  };

  const formatarMoeda = (valor: number) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Prepara os dados para o formato que a biblioteca de gráficos exige
  const pieData = dados.map((item, index) => ({
    value: item.percentual,
    color: CORES[index % CORES.length],
    text: `${item.percentual}%`,
    focused: index === 0, // Destaca a maior categoria
  }));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      
      {/* Header com Navegação de Meses */}
      <View style={styles.header}>
        <Text style={styles.title}>Relatórios</Text>
        <View style={styles.monthSelector}>
          <TouchableOpacity onPress={() => mudarMes('anterior')} style={styles.monthBtn}>
            <Feather name="chevron-left" size={20} color="#10B981" />
          </TouchableOpacity>
          <Text style={styles.monthText}>{mesesNome[mesAtual - 1]} {anoAtual}</Text>
          <TouchableOpacity onPress={() => mudarMes('proximo')} style={styles.monthBtn}>
            <Feather name="chevron-right" size={20} color="#10B981" />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#10B981" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          
          {dados.length === 0 ? (
            <View style={styles.emptyState}>
              <Feather name="pie-chart" size={48} color="#1A2540" />
              <Text style={styles.emptyText}>Nenhuma despesa registrada neste mês.</Text>
            </View>
          ) : (
            <>
              {/* Gráfico Donut */}
              <View style={styles.chartCard}>
                <PieChart
                  donut
                  innerRadius={70}
                  radius={110}
                  data={pieData}
                  centerLabelComponent={() => {
                    return (
                      <View style={{justifyContent: 'center', alignItems: 'center'}}>
                        <Text style={{fontSize: 16, color: '#9CA3AF', alignItems: 'center'}}>Total Gasto</Text>
                        <Text style={{fontSize: 18, color: '#FFFFFF', fontWeight: 'bold'}}>
                          {formatarMoeda(totalGeral)}
                        </Text>
                      </View>
                    );
                  }}
                />
              </View>

              {/* Lista de Categorias */}
              <Text style={styles.sectionTitle}>Detalhes por Categoria</Text>
              
              <View style={styles.listContainer}>
                {dados.map((item, index) => (
                  <View key={index} style={styles.listItem}>
                    
                    <View style={styles.listLeft}>
                      <View style={[styles.colorDot, { backgroundColor: CORES[index % CORES.length] }]} />
                      <View>
                        <Text style={styles.categoryName}>{item.categoria}</Text>
                        <Text style={styles.categoryPercent}>{item.percentual}%</Text>
                      </View>
                    </View>

                    <Text style={styles.categoryValue}>
                      {formatarMoeda(item.total)}
                    </Text>
                    
                  </View>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050A14' },
  header: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 10 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 16 },
  monthSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0B1120', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#1A2540' },
  monthBtn: { padding: 8, backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: 8 },
  monthText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingHorizontal: 24, paddingBottom: 100, paddingTop: 20 },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  emptyText: { color: '#4A5980', fontSize: 16, marginTop: 16, textAlign: 'center' },
  chartCard: { backgroundColor: '#0B1120', borderRadius: 24, borderWidth: 1, borderColor: '#1A2540', paddingVertical: 32, alignItems: 'center', marginBottom: 32, shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#FFFFFF', marginBottom: 16 },
  listContainer: { backgroundColor: '#0B1120', borderRadius: 24, borderWidth: 1, borderColor: '#1A2540', padding: 8 },
  listItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.03)' },
  listLeft: { flexDirection: 'row', alignItems: 'center' },
  colorDot: { width: 12, height: 12, borderRadius: 6, marginRight: 16 },
  categoryName: { fontSize: 15, fontWeight: '600', color: '#FFFFFF', marginBottom: 4 },
  categoryPercent: { fontSize: 13, color: '#9CA3AF' },
  categoryValue: { fontSize: 16, fontWeight: 'bold', color: '#EF4444' },
});