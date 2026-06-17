import React, { useState, useCallback } from 'react';
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

import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext'; // <-- Importando o motor de temas

// Paleta de cores para os "fatias" do gráfico (funcionam bem em ambos os temas)
const CORES = [
  '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', 
  '#EC4899', '#06B6D4', '#EF4444', '#84CC16',
];

export default function RelatoriosScreen() {
  const { colors } = useTheme(); // <-- Captura as cores do tema ativo
  
  const [loading, setLoading] = useState(true);
  const [dados, setDados] = useState<any[]>([]);
  const [totalGeral, setTotalGeral] = useState(0);
  
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

  const pieData = dados.map((item, index) => ({
    value: item.percentual,
    color: CORES[index % CORES.length],
    text: `${item.percentual}%`,
    focused: index === 0,
  }));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      
      {/* Header com Navegação de Meses */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Relatórios</Text>
        
        <View style={[styles.monthSelector, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity 
            onPress={() => mudarMes('anterior')} 
            style={[styles.monthBtn, { backgroundColor: colors.primary + '1A' }]}
          >
            <Feather name="chevron-left" size={20} color={colors.primary} />
          </TouchableOpacity>
          
          <Text style={[styles.monthText, { color: colors.text }]}>
            {mesesNome[mesAtual - 1]} {anoAtual}
          </Text>
          
          <TouchableOpacity 
            onPress={() => mudarMes('proximo')} 
            style={[styles.monthBtn, { backgroundColor: colors.primary + '1A' }]}
          >
            <Feather name="chevron-right" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          
          {dados.length === 0 ? (
            <View style={styles.emptyState}>
              <Feather name="pie-chart" size={48} color={colors.border} />
              <Text style={[styles.emptyText, { color: colors.textDark }]}>Nenhuma despesa registrada neste mês.</Text>
            </View>
          ) : (
            <>
              {/* Gráfico Donut */}
              <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <PieChart
                  donut
                  innerRadius={70}
                  radius={110}
                  data={pieData}
                  centerLabelComponent={() => {
                    return (
                      <View style={{justifyContent: 'center', alignItems: 'center'}}>
                        <Text style={{fontSize: 16, color: colors.textMuted, alignItems: 'center'}}>Total Gasto</Text>
                        <Text style={{fontSize: 18, color: colors.text, fontWeight: 'bold'}}>
                          {formatarMoeda(totalGeral)}
                        </Text>
                      </View>
                    );
                  }}
                />
              </View>

              {/* Lista de Categorias */}
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Detalhes por Categoria</Text>
              
              <View style={[styles.listContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {dados.map((item, index) => (
                  <View 
                    key={index} 
                    style={[styles.listItem, { borderBottomColor: colors.border + '50' }]}
                  >
                    <View style={styles.listLeft}>
                      <View style={[styles.colorDot, { backgroundColor: CORES[index % CORES.length] }]} />
                      <View>
                        <Text style={[styles.categoryName, { color: colors.text }]}>{item.categoria}</Text>
                        <Text style={[styles.categoryPercent, { color: colors.textMuted }]}>{item.percentual}%</Text>
                      </View>
                    </View>

                    <Text style={[styles.categoryValue, { color: colors.danger }]}>
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
  container: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 10 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 16 },
  monthSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 16, padding: 12, borderWidth: 1 },
  monthBtn: { padding: 8, borderRadius: 8 },
  monthText: { fontSize: 16, fontWeight: '600' },
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingHorizontal: 24, paddingBottom: 100, paddingTop: 20 },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  emptyText: { fontSize: 16, marginTop: 16, textAlign: 'center' },
  chartCard: { borderRadius: 24, borderWidth: 1, paddingVertical: 32, alignItems: 'center', marginBottom: 32, shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
  listContainer: { borderRadius: 24, borderWidth: 1, padding: 8 },
  listItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
  listLeft: { flexDirection: 'row', alignItems: 'center' },
  colorDot: { width: 12, height: 12, borderRadius: 6, marginRight: 16 },
  categoryName: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  categoryPercent: { fontSize: 13 },
  categoryValue: { fontSize: 16, fontWeight: 'bold' },
});