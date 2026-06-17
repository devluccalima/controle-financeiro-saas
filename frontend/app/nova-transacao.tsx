import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Modal, FlatList, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { InternalBackground } from '../components/InternalBackground';

import api from '../services/api';
import { useTheme } from '../context/ThemeContext'; // <-- Importando o motor de temas

const CORES_PALETA = [
    '#8A05BE', '#FF6200', '#EF4444', '#10B981', '#0e75ca', '#FBBF24',
];

export default function NovaTransacaoScreen() {
    const router = useRouter();
    const { colors, theme } = useTheme(); // <-- Capturando o tema atual
    
    const { id } = useLocalSearchParams();
    const isEditMode = !!id;

    const getDataAtual = () => {
        const hoje = new Date();
        const dia = String(hoje.getDate()).padStart(2, '0');
        const mes = String(hoje.getMonth() + 1).padStart(2, '0');
        const ano = hoje.getFullYear();
        return `${dia}/${mes}/${ano}`;
    };

    const [isLoading, setIsLoading] = useState(isEditMode); 
    const [tipo, setTipo] = useState<'despesa' | 'receita'>('despesa');
    const [natureza, setNatureza] = useState<'variavel' | 'fixa'>('variavel');
    const [valor, setValor] = useState('');
    const [descricao, setDescricao] = useState('');
    const [data, setData] = useState(getDataAtual());

    const [categorias, setCategorias] = useState<any[]>([]);
    const [contas, setContas] = useState<any[]>([]);
    const categoriasFiltradas = categorias.filter(cat => cat.tipo === tipo);

    const [categoriaSelecionada, setCategoriaSelecionada] = useState<{ id: string, nome: string, cor: string, icone?: string } | null>(null);
    const [modalCategoriaVisible, setModalCategoriaVisible] = useState(false);
    
    const [contaSelecionada, setContaSelecionada] = useState<{ id: string, nome: string, cor: string } | null>(null);
    const [modalContaVisible, setModalContaVisible] = useState(false);

    const [modalCriarContaVisible, setModalCriarContaVisible] = useState(false);
    const [novaContaNome, setNovaContaNome] = useState('');
    const [novaContaCor, setNovaContaCor] = useState('#8A05BE');

    const [isParcelado, setIsParcelado] = useState(false);
    const [parcelas, setParcelas] = useState('');

    const valorNumericoTemp = parseFloat(valor.replace(/\./g, '').replace(',', '.')) || 0;
    const qtdParcelas = parseInt(parcelas) || 1;
    const valorParcelaPreview = (valorNumericoTemp / qtdParcelas).toFixed(2).replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');

    useEffect(() => {
        carregarDadosDoBanco();
    }, []);

    const carregarDadosDoBanco = async () => {
        try {
            const contasResponse = await api.get('/accounts/');
            const contasData = contasResponse.data;
            setContas(contasData);

            const categoriasResponse = await api.get('/categories/');
            const categoriasData = categoriasResponse.data;
            setCategorias(categoriasData);

            if (isEditMode) {
                const transacaoResponse = await api.get(`/transactions/${id}`);
                const t = transacaoResponse.data;

                setTipo(t.tipo);
                setNatureza(t.natureza);
                setDescricao(t.descricao);
                
                setValor(parseFloat(t.valor).toFixed(2).replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.'));
                
                if (t.natureza === 'fixa') {
                    setData(t.data_vencimento.split('-')[2]); 
                } else {
                    const [ano, mes, dia] = t.data_vencimento.split('-');
                    setData(`${dia}/${mes}/${ano}`);
                }

                const contaEncontrada = contasData.find((c: any) => c.id === t.account_id);
                if (contaEncontrada) setContaSelecionada(contaEncontrada);

                const categoriaEncontrada = categoriasData.find((c: any) => c.id === t.category_id);
                if (categoriaEncontrada) setCategoriaSelecionada(categoriaEncontrada);

                setIsParcelado(t.is_parcelado);
                if (t.is_parcelado) {
                    setParcelas(String(t.total_parcelas));
                }
            }
        } catch (error) {
            console.error("Erro ao buscar dados:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleValorChange = (text: string) => {
        const apenasNumeros = text.replace(/\D/g, '');
        if (!apenasNumeros) { setValor(''); return; }
        const valorDecimal = (Number(apenasNumeros) / 100).toFixed(2);
        setValor(valorDecimal.replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.'));
    };

    const handleDataChange = (text: string) => {
        let apenasNumeros = text.replace(/\D/g, '');
        if (natureza === 'fixa') {
            if (apenasNumeros.length > 2) apenasNumeros = apenasNumeros.slice(0, 2);
            setData(apenasNumeros);
            return;
        }
        if (apenasNumeros.length > 8) apenasNumeros = apenasNumeros.slice(0, 8);
        let formatada = apenasNumeros;
        if (apenasNumeros.length > 2) formatada = `${apenasNumeros.slice(0, 2)}/${apenasNumeros.slice(2)}`;
        if (apenasNumeros.length > 4) formatada = `${apenasNumeros.slice(0, 2)}/${apenasNumeros.slice(2, 4)}/${apenasNumeros.slice(4)}`;
        setData(formatada);
    };

    const handleCriarContaRapida = async () => {
        if (!novaContaNome) return;
        try {
            const response = await api.post('/accounts/', { nome: novaContaNome, tipo: 'Corrente', cor: novaContaCor });
            const novaContaObj = { id: response.data.id, nome: novaContaNome, tipo: 'Corrente', cor: novaContaCor };
            setContas([...contas, novaContaObj]);
            setNovaContaNome('');
            setNovaContaCor('#8A05BE');
            setModalCriarContaVisible(false);
            setTimeout(() => { setModalContaVisible(true); }, 100);
        } catch (error) {
            alert("Não foi possível salvar a nova conta.");
        }
    };

    const handleSalvar = async () => {
        if (!valor || !descricao || !data || !categoriaSelecionada || !contaSelecionada) {
            alert("Por favor, preencha todos os campos obrigatórios.");
            return;
        }

        try {
            const valorNumerico = parseFloat(valor.replace(/\./g, '').replace(',', '.'));

            const payload = {
                tipo,
                natureza,
                valor: valorNumerico,
                descricao,
                data,
                category_id: categoriaSelecionada.id,
                account_id: contaSelecionada.id,
                is_parcelado: isParcelado,
                total_parcelas: isParcelado ? parseInt(parcelas) : 1
            };

            if (isEditMode) {
                await api.put(`/transactions/${id}`, payload);
            } else {
                await api.post('/transactions/', payload);
            }
            
            router.replace('/dashboard'); 

        } catch (error) {
            console.error("Erro ao salvar transação:", error);
            alert("Ocorreu um erro ao salvar o lançamento no servidor.");
        }
    };

    if (isLoading) {
        return (
            <InternalBackground>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </InternalBackground>
        );
    }

    return (
        <InternalBackground>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Feather name="arrow-left" size={24} color={colors.textMuted} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>{isEditMode ? 'Editar Lançamento' : 'Novo Lançamento'}</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>

                    {/* SELETOR DE TIPO (DESPESA/RECEITA) */}
                    <View style={[styles.typeSelector, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <TouchableOpacity 
                            style={[styles.typeButton, tipo === 'despesa' && { backgroundColor: `${colors.danger}1A` }]} 
                            onPress={() => { setTipo('despesa'); setCategoriaSelecionada(null); }}
                        >
                            <Feather name="arrow-down-circle" size={20} color={tipo === 'despesa' ? colors.danger : colors.textMuted} />
                            <Text style={[styles.typeText, { color: tipo === 'despesa' ? colors.danger : colors.textMuted }]}>Despesa</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.typeButton, tipo === 'receita' && { backgroundColor: `${colors.primary}1A` }]} 
                            onPress={() => { setTipo('receita'); setCategoriaSelecionada(null); }}
                        >
                            <Feather name="arrow-up-circle" size={20} color={tipo === 'receita' ? colors.primary : colors.textMuted} />
                            <Text style={[styles.typeText, { color: tipo === 'receita' ? colors.primary : colors.textMuted }]}>Receita</Text>
                        </TouchableOpacity>
                    </View>

                    {/* CAMPO DE VALOR */}
                    <View style={styles.amountContainer}>
                        <Text style={[styles.currencySymbol, { color: colors.textMuted }]}>R$</Text>
                        <TextInput 
                            style={[styles.amountInput, { color: tipo === 'despesa' ? colors.danger : colors.primary }]} 
                            value={valor} 
                            onChangeText={handleValorChange} 
                            keyboardType="number-pad" 
                            placeholder="0,00" 
                            placeholderTextColor={colors.textDark} 
                            maxLength={15} 
                        />
                    </View>

                    {/* NATUREZA DA TRANSAÇÃO */}
                    <Text style={[styles.label, { color: colors.textMuted }]}>Natureza da Transação</Text>
                    <View style={styles.natureSelector}>
                        <TouchableOpacity 
                            style={[
                                styles.natureButton, 
                                { backgroundColor: colors.card, borderColor: colors.border },
                                natureza === 'variavel' && { backgroundColor: colors.inputBg, borderColor: colors.primary }
                            ]} 
                            onPress={() => { setNatureza('variavel'); setData(getDataAtual()); }}
                        >
                            <Feather name="activity" size={16} color={natureza === 'variavel' ? colors.primary : colors.textMuted} />
                            <Text style={[styles.natureText, { color: natureza === 'variavel' ? colors.text : colors.textMuted }]}>Variável</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[
                                styles.natureButton, 
                                { backgroundColor: colors.card, borderColor: colors.border },
                                natureza === 'fixa' && { backgroundColor: colors.inputBg, borderColor: colors.primary }
                            ]} 
                            onPress={() => { setNatureza('fixa'); setData(String(new Date().getDate()).padStart(2, '0')); setIsParcelado(false); }}
                        >
                            <Feather name="anchor" size={16} color={natureza === 'fixa' ? colors.primary : colors.textMuted} />
                            <Text style={[styles.natureText, { color: natureza === 'fixa' ? colors.text : colors.textMuted }]}>Fixa</Text>
                        </TouchableOpacity>
                    </View>

                    {/* PARCELAMENTO */}
                    {tipo === 'despesa' && natureza === 'variavel' && !isEditMode && (
                        <View style={styles.installmentContainer}>
                            <View style={[styles.installmentToggleRow, isParcelado && { marginBottom: 16 }]}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <Feather name="layers" size={18} color={colors.textMuted} />
                                    <Text style={[styles.installmentLabel, { color: colors.textMuted }]}>Compra Parcelada?</Text>
                                </View>
                                <TouchableOpacity 
                                    style={[styles.toggleTrack, { backgroundColor: isParcelado ? colors.primary : colors.inputBg }]} 
                                    onPress={() => setIsParcelado(!isParcelado)} 
                                    activeOpacity={0.8}
                                >
                                    <View style={[
                                        styles.toggleThumb, 
                                        { backgroundColor: isParcelado ? '#FFFFFF' : colors.textMuted },
                                        isParcelado && styles.toggleThumbActive
                                    ]} />
                                </TouchableOpacity>
                            </View>

                            {isParcelado && (
                                <View>
                                    <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                        <TextInput 
                                            style={[styles.inputText, { textAlign: 'center', color: colors.text }]} 
                                            placeholder="Quantidade de Parcelas (Ex: 10)" 
                                            placeholderTextColor={colors.textDark} 
                                            value={parcelas} 
                                            onChangeText={setParcelas} 
                                            keyboardType="number-pad" 
                                            maxLength={2} 
                                        />
                                    </View>
                                    {valorNumericoTemp > 0 && parcelas ? (
                                        <Text style={[styles.installmentPreview, { color: colors.primary }]}>
                                            Sua dívida será dividida em {parcelas}x de R$ {valorParcelaPreview}
                                        </Text>
                                    ) : null}
                                </View>
                            )}
                        </View>
                    )}

                    {/* CONTA BANCÁRIA */}
                    <Text style={[styles.label, { color: colors.textMuted }]}>Conta Bancária</Text>
                    <TouchableOpacity style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]} activeOpacity={0.8} onPress={() => setModalContaVisible(true)}>
                        {contaSelecionada ? (
                            <Feather name="credit-card" size={20} color={contaSelecionada.cor} style={{ marginRight: 12 }} />
                        ) : (
                            <View style={[styles.colorDot, { backgroundColor: colors.border }]} />
                        )}
                        <Text style={[styles.inputText, { color: contaSelecionada ? colors.text : colors.textDark }]}>
                            {contaSelecionada ? contaSelecionada.nome : 'Selecione a conta...'}
                        </Text>
                        <Feather name="chevron-down" size={20} color={colors.textMuted} />
                    </TouchableOpacity>

                    {/* CATEGORIA */}
                    <Text style={[styles.label, { color: colors.textMuted }]}>Categoria</Text>
                    <TouchableOpacity style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]} activeOpacity={0.8} onPress={() => setModalCategoriaVisible(true)}>
                        {categoriaSelecionada ? (
                            <Feather name={categoriaSelecionada.icone as any || 'tag'} size={20} color={categoriaSelecionada.cor} style={{ marginRight: 12 }} />
                        ) : (
                            <View style={[styles.colorDot, { backgroundColor: colors.border }]} />
                        )}
                        <Text style={[styles.inputText, { color: categoriaSelecionada ? colors.text : colors.textDark }]}>
                            {categoriaSelecionada ? categoriaSelecionada.nome : 'Selecione a categoria...'}
                        </Text>
                        <Feather name="chevron-down" size={20} color={colors.textMuted} />
                    </TouchableOpacity>

                    {/* DESCRIÇÃO */}
                    <Text style={[styles.label, { color: colors.textMuted }]}>Descrição</Text>
                    <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Feather name="edit-3" size={20} color={colors.textMuted} style={styles.inputIcon} />
                        <TextInput 
                            style={[styles.inputText, { color: colors.text }]} 
                            placeholder="Ex: Mercado..." 
                            placeholderTextColor={colors.textDark} 
                            value={descricao} 
                            onChangeText={setDescricao} 
                        />
                    </View>

                    {/* DATA */}
                    {natureza === 'variavel' ? (
                        <>
                            <Text style={[styles.label, { color: colors.textMuted }]}>{tipo === 'despesa' ? 'Data da Despesa' : 'Data do Recebimento'}</Text>
                            <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                <Feather name="calendar" size={20} color={colors.textMuted} style={styles.inputIcon} />
                                <TextInput style={[styles.inputText, { color: colors.text }]} placeholder="DD/MM/AAAA" placeholderTextColor={colors.textDark} value={data} onChangeText={handleDataChange} keyboardType="number-pad" maxLength={10} />
                            </View>
                        </>
                    ) : (
                        <>
                            <Text style={[styles.label, { color: colors.textMuted }]}>{tipo === 'despesa' ? 'Dia do Vencimento (Fixo)' : 'Dia do Recebimento (Fixo)'}</Text>
                            <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                <Feather name="calendar" size={20} color={colors.textMuted} style={styles.inputIcon} />
                                <TextInput style={[styles.inputText, { color: colors.text }]} placeholder="Ex: 05, 10, 20" placeholderTextColor={colors.textDark} value={data} onChangeText={handleDataChange} keyboardType="number-pad" maxLength={2} />
                            </View>
                        </>
                    )}

                    {/* BOTÃO SALVAR */}
                    <TouchableOpacity style={[styles.submitButton, { backgroundColor: colors.primary }]} onPress={handleSalvar} activeOpacity={0.8}>
                        <Text style={[styles.submitButtonText, { color: theme === 'dark' ? '#FFFFFF' : '#050A14' }]}>{isEditMode ? 'Atualizar Lançamento' : 'Salvar Lançamento'}</Text>
                        <Feather name={isEditMode ? "refresh-cw" : "check"} size={20} color={theme === 'dark' ? '#FFFFFF' : '#050A14'} />
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>

            {/* MODAL DE CATEGORIAS */}
            <Modal visible={modalCategoriaVisible} transparent={true} animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Escolha a Categoria</Text>
                            <TouchableOpacity onPress={() => setModalCategoriaVisible(false)} style={styles.modalCloseButton}>
                                <Feather name="x" size={24} color={colors.textMuted} />
                            </TouchableOpacity>
                        </View>
                        <FlatList data={categoriasFiltradas} keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={[styles.listItem, { borderBottomColor: colors.border + '50' }]} onPress={() => { setCategoriaSelecionada(item); setModalCategoriaVisible(false); }}>
                                    <View style={[styles.iconBoxSmall, { backgroundColor: `${item.cor || colors.primary}20` }]}>
                                        <Feather name={item.icone || 'tag'} size={16} color={item.cor || colors.primary} />
                                    </View>
                                    <Text style={[styles.listText, { color: colors.text }]}>{item.nome}</Text>
                                </TouchableOpacity>
                            )} />
                    </View>
                </View>
            </Modal>

            {/* MODAL DE CONTAS */}
            <Modal visible={modalContaVisible} transparent={true} animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Qual Conta?</Text>
                            <TouchableOpacity onPress={() => setModalContaVisible(false)} style={styles.modalCloseButton}>
                                <Feather name="x" size={24} color={colors.textMuted} />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity 
                            style={[styles.createAccountButton, { backgroundColor: `${colors.primary}1A`, borderColor: `${colors.primary}4D` }]} 
                            onPress={() => { setModalContaVisible(false); setTimeout(() => { setModalCriarContaVisible(true); }, 100); }}
                        >
                            <Feather name="plus-circle" size={20} color={colors.primary} />
                            <Text style={[styles.createAccountText, { color: colors.primary }]}>Adicionar nova conta</Text>
                        </TouchableOpacity>

                        <FlatList data={contas} keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={[styles.listItem, { borderBottomColor: colors.border + '50' }]} onPress={() => { setContaSelecionada(item); setModalContaVisible(false); }}>
                                    <View style={[styles.iconBoxSmall, { backgroundColor: `${item.cor || colors.secondary}20` }]}>
                                        <Feather name="credit-card" size={16} color={item.cor || colors.secondary} />
                                    </View>
                                    <Text style={[styles.listText, { color: colors.text }]}>{item.nome}</Text>
                                </TouchableOpacity>
                            )} />
                    </View>
                </View>
            </Modal>

            {/* MODAL CRIAR CONTA */}
            <Modal visible={modalCriarContaVisible} transparent={true} animationType="fade">
                <View style={styles.modalOverlayCentered}>
                    <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Nova Conta</Text>
                        <TextInput 
                            style={[styles.modalInput, { backgroundColor: colors.inputBg, color: colors.text }]} 
                            placeholder="Ex: Nubank, Itaú, Santander..." 
                            placeholderTextColor={colors.textDark} 
                            value={novaContaNome} 
                            onChangeText={setNovaContaNome} 
                            autoFocus 
                        />
                        <Text style={[styles.labelSmall, { color: colors.textMuted }]}>Escolha uma cor identificadora:</Text>
                        <View style={styles.paletteContainer}>
                            {CORES_PALETA.map((cor) => (
                                <TouchableOpacity 
                                    key={cor} 
                                    style={[
                                        styles.paletteCircle, 
                                        { backgroundColor: cor }, 
                                        novaContaCor === cor && [styles.paletteCircleActive, { borderColor: colors.text }]
                                    ]} 
                                    onPress={() => setNovaContaCor(cor)} 
                                    activeOpacity={0.7} 
                                />
                            ))}
                        </View>
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.modalActionButton} onPress={() => { setModalCriarContaVisible(false); setTimeout(() => { setModalContaVisible(true); }, 100); }}>
                                <Text style={[styles.modalActionTextCancel, { color: colors.textMuted }]}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleCriarContaRapida} style={[styles.modalActionButtonPrimary, { backgroundColor: colors.primary }]}>
                                <Text style={[styles.modalActionTextConfirm, { color: theme === 'dark' ? '#FFFFFF' : '#050A14' }]}>Criar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </InternalBackground>
    );
}

const styles = StyleSheet.create({
    scrollPadding: { paddingTop: 20, paddingBottom: 60 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, marginTop: 20 },
    backButton: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    typeSelector: { flexDirection: 'row', borderRadius: 16, padding: 6, borderWidth: 1, marginBottom: 32 },
    typeButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, gap: 8 },
    typeText: { fontSize: 15, fontWeight: '600' },
    amountContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 40 },
    currencySymbol: { fontSize: 24, fontWeight: 'bold', marginRight: 8, marginTop: 8 },
    amountInput: { fontSize: 48, fontWeight: 'bold', minWidth: 120, textAlign: 'center' },
    label: { fontSize: 13, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
    labelSmall: { fontSize: 12, fontWeight: '600', marginBottom: 12, textTransform: 'uppercase' },
    natureSelector: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    natureButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, borderWidth: 1, gap: 8 },
    natureText: { fontSize: 14, fontWeight: '600' },
    inputContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, marginBottom: 24, paddingHorizontal: 16, minHeight: 56 },
    inputIcon: { marginRight: 12 },
    inputText: { flex: 1, fontSize: 16, paddingVertical: 16 },
    
    colorDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
    iconBoxSmall: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 12 }, 

    submitButton: { flexDirection: 'row', borderRadius: 16, paddingVertical: 18, justifyContent: 'center', alignItems: 'center', marginTop: 16, gap: 12 },
    submitButtonText: { fontSize: 16, fontWeight: 'bold' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, minHeight: '40%', padding: 24, borderWidth: 1 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    modalTitle: { fontSize: 18, fontWeight: 'bold' },
    modalCloseButton: { padding: 4 },
    listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1 },
    listText: { flex: 1, fontSize: 16, fontWeight: '500' },

    createAccountButton: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1 },
    createAccountText: { fontSize: 16, fontWeight: 'bold', marginLeft: 12 },

    modalOverlayCentered: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalCard: { width: '100%', borderRadius: 20, padding: 24, borderWidth: 1 },
    modalInput: { borderRadius: 12, padding: 16, fontSize: 16, marginTop: 8, marginBottom: 20 },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
    modalActionButton: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12 },
    modalActionButtonPrimary: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12 },
    modalActionTextCancel: { fontSize: 16, fontWeight: 'bold' },
    modalActionTextConfirm: { fontSize: 16, fontWeight: 'bold' },

    paletteContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28 },
    paletteCircle: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: 'transparent' },
    paletteCircleActive: { transform: [{ scale: 1.1 }] },

    installmentContainer: { marginBottom: 24, paddingHorizontal: 4 },
    installmentToggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    installmentLabel: { fontSize: 14, fontWeight: '600' },
    toggleTrack: { width: 44, height: 24, borderRadius: 12, padding: 2, justifyContent: 'center' },
    toggleThumb: { width: 20, height: 20, borderRadius: 10 },
    toggleThumbActive: { transform: [{ translateX: 20 }] },
    installmentPreview: { fontSize: 13, fontWeight: '600', textAlign: 'center', marginTop: -12, marginBottom: 8 },
});