import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Modal, FlatList } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { InternalBackground } from '../components/InternalBackground';

import api from '../services/api';

// Paleta de cores para as Contas Bancárias (Cores dos principais bancos)
const CORES_PALETA = [
    '#8A05BE', // Roxo (Nubank)
    '#FF6200', // Laranja (Itaú/Inter)
    '#EF4444', // Vermelho (Santander/Bradesco)
    '#10B981', // Verde (Carteira/Picpay)
    '#0e75ca', // Azul (Caixa/Mercado Pago)
    '#FBBF24', // Amarelo (Banco do Brasil)
];

export default function NovaTransacaoScreen() {
    const router = useRouter();

    // Função para pegar a data de hoje no formato DD/MM/AAAA
    const getDataAtual = () => {
        const hoje = new Date();
        const dia = String(hoje.getDate()).padStart(2, '0');
        const mes = String(hoje.getMonth() + 1).padStart(2, '0');
        const ano = hoje.getFullYear();
        return `${dia}/${mes}/${ano}`;
    };

    // 1. Estados Gerais
    const [tipo, setTipo] = useState<'despesa' | 'receita'>('despesa');
    const [natureza, setNatureza] = useState<'variavel' | 'fixa'>('variavel');
    const [valor, setValor] = useState('');
    const [descricao, setDescricao] = useState('');
    const [data, setData] = useState(getDataAtual());

    // 2. Estados de Listas vindas da API
    const [categorias, setCategorias] = useState<any[]>([]);
    const [contas, setContas] = useState<any[]>([]);

    // 3. O Filtro Dinâmico de Categorias (Depende das listas e do tipo)
    const categoriasFiltradas = categorias.filter(cat => cat.tipo === tipo);

    // 4. Estados de Seleção dos Modais
    const [categoriaSelecionada, setCategoriaSelecionada] = useState<{ id: string, nome: string, cor: string } | null>(null);
    const [modalCategoriaVisible, setModalCategoriaVisible] = useState(false);
    
    const [contaSelecionada, setContaSelecionada] = useState<{ id: string, nome: string, cor: string } | null>(null);
    const [modalContaVisible, setModalContaVisible] = useState(false);

    // 5. Estados de Criação de Nova Conta
    const [modalCriarContaVisible, setModalCriarContaVisible] = useState(false);
    const [novaContaNome, setNovaContaNome] = useState('');
    const [novaContaCor, setNovaContaCor] = useState('#8A05BE');

    // 6. Estados de Parcelamento
    const [isParcelado, setIsParcelado] = useState(false);
    const [parcelas, setParcelas] = useState('');

    // Lógica matemática para o preview da parcela em tempo real
    const valorNumericoTemp = parseFloat(valor.replace(/\./g, '').replace(',', '.')) || 0;
    const qtdParcelas = parseInt(parcelas) || 1;
    const valorParcelaPreview = (valorNumericoTemp / qtdParcelas).toFixed(2).replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');

    // --- CARREGAMENTO INICIAL DO BANCO DE DADOS ---
    useEffect(() => {
        carregarDadosDoBanco();
    }, []);

    const carregarDadosDoBanco = async () => {
        try {
            const contasResponse = await api.get('/accounts/');
            setContas(contasResponse.data);

            const categoriasResponse = await api.get('/categories/');
            setCategorias(categoriasResponse.data);
        } catch (error) {
            console.error("Erro ao buscar dados:", error);
        }
    };

    // Máscara do Valor
    const handleValorChange = (text: string) => {
        const apenasNumeros = text.replace(/\D/g, '');
        if (!apenasNumeros) { setValor(''); return; }
        const valorDecimal = (Number(apenasNumeros) / 100).toFixed(2);
        setValor(valorDecimal.replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.'));
    };

    // MÁSCARA DA DATA
    const handleDataChange = (text: string) => {
        let apenasNumeros = text.replace(/\D/g, '');

        if (natureza === 'fixa') {
            if (apenasNumeros.length > 2) apenasNumeros = apenasNumeros.slice(0, 2);
            setData(apenasNumeros);
            return;
        }
        
        if (apenasNumeros.length > 8) apenasNumeros = apenasNumeros.slice(0, 8);

        let formatada = apenasNumeros;
        if (apenasNumeros.length > 2) {
            formatada = `${apenasNumeros.slice(0, 2)}/${apenasNumeros.slice(2)}`;
        }
        if (apenasNumeros.length > 4) {
            formatada = `${apenasNumeros.slice(0, 2)}/${apenasNumeros.slice(2, 4)}/${apenasNumeros.slice(4)}`;
        }

        setData(formatada);
    };

    // Fluxo Inteligente: Cria a conta na API, atualiza a lista e volta para o Modal 1
    const handleCriarContaRapida = async () => {
        if (!novaContaNome) return;

        try {
            const response = await api.post('/accounts/', {
                nome: novaContaNome,
                tipo: 'Corrente',
                cor: novaContaCor
            });

            const novaContaObj = {
                id: response.data.id,
                nome: novaContaNome,
                tipo: 'Corrente',
                cor: novaContaCor
            };

            setContas([...contas, novaContaObj]);
            setNovaContaNome('');
            setNovaContaCor('#8A05BE');
            setModalCriarContaVisible(false);
            
            setTimeout(() => {
                setModalContaVisible(true);
            }, 100);

        } catch (error) {
            console.error("Erro ao criar conta:", error);
            alert("Não foi possível salvar a nova conta.");
        }
    };

    // Fluxo Principal de Salvar o Lançamento
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

            await api.post('/transactions/', payload);
            
            // Sucesso! Volta para o Dashboard forçando atualização
            router.replace('/dashboard'); 

        } catch (error) {
            console.error("Erro ao salvar transação:", error);
            alert("Ocorreu um erro ao salvar o lançamento no servidor.");
        }
    };

    return (
        <InternalBackground>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Feather name="arrow-left" size={24} color="#7B8DB0" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Novo Lançamento</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>

                    {/* SELETOR DE TIPO */}
                    <View style={styles.typeSelector}>
                        <TouchableOpacity style={[styles.typeButton, tipo === 'despesa' && styles.typeButtonDespesaActive]} onPress={() => { setTipo('despesa'); setCategoriaSelecionada(null); }}>
                            <Feather name="arrow-down-circle" size={20} color={tipo === 'despesa' ? '#EF4444' : '#7B8DB0'} />
                            <Text style={[styles.typeText, tipo === 'despesa' && { color: '#EF4444' }]}>Despesa</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.typeButton, tipo === 'receita' && styles.typeButtonReceitaActive]} onPress={() => { setTipo('receita'); setCategoriaSelecionada(null); }}>
                            <Feather name="arrow-up-circle" size={20} color={tipo === 'receita' ? '#10B981' : '#7B8DB0'} />
                            <Text style={[styles.typeText, tipo === 'receita' && { color: '#10B981' }]}>Receita</Text>
                        </TouchableOpacity>
                    </View>

                    {/* VALOR GIGANTE */}
                    <View style={styles.amountContainer}>
                        <Text style={styles.currencySymbol}>R$</Text>
                        <TextInput style={[styles.amountInput, { color: tipo === 'despesa' ? '#EF4444' : '#10B981' }]} value={valor} onChangeText={handleValorChange} keyboardType="number-pad" placeholder="0,00" placeholderTextColor="#4A5980" maxLength={15} />
                    </View>

                    {/* NATUREZA */}
                    <Text style={styles.label}>Natureza da Transação</Text>
                    <View style={styles.natureSelector}>
                        <TouchableOpacity
                            style={[styles.natureButton, natureza === 'variavel' && styles.natureButtonActive]}
                            onPress={() => {
                                setNatureza('variavel');
                                setData(getDataAtual());
                            }}
                        >
                            <Feather name="activity" size={16} color={natureza === 'variavel' ? '#FFFFFF' : '#7B8DB0'} />
                            <Text style={[styles.natureText, natureza === 'variavel' && { color: '#FFFFFF' }]}>Variável</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.natureButton, natureza === 'fixa' && styles.natureButtonActive]}
                            onPress={() => {
                                setNatureza('fixa');
                                setData(String(new Date().getDate()).padStart(2, '0'));
                                setIsParcelado(false); 
                            }}
                        >
                            <Feather name="anchor" size={16} color={natureza === 'fixa' ? '#FFFFFF' : '#7B8DB0'} />
                            <Text style={[styles.natureText, natureza === 'fixa' && { color: '#FFFFFF' }]}>Fixa</Text>
                        </TouchableOpacity>
                    </View>

                    {/* PARCELAMENTO */}
                    {tipo === 'despesa' && natureza === 'variavel' && (
                        <View style={styles.installmentContainer}>
                            <View style={[styles.installmentToggleRow, isParcelado && { marginBottom: 16 }]}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <Feather name="layers" size={18} color="#7B8DB0" />
                                    <Text style={styles.installmentLabel}>Compra Parcelada?</Text>
                                </View>
                                <TouchableOpacity
                                    style={[styles.toggleTrack, isParcelado && styles.toggleTrackActive]}
                                    onPress={() => setIsParcelado(!isParcelado)}
                                    activeOpacity={0.8}
                                >
                                    <View style={[styles.toggleThumb, isParcelado && styles.toggleThumbActive]} />
                                </TouchableOpacity>
                            </View>

                            {isParcelado && (
                                <View>
                                    <View style={styles.inputContainer}>
                                        <TextInput
                                            style={[styles.inputText, { textAlign: 'center' }]}
                                            placeholder="Quantidade de Parcelas (Ex: 10)"
                                            placeholderTextColor="#4A5980"
                                            value={parcelas}
                                            onChangeText={setParcelas}
                                            keyboardType="number-pad"
                                            maxLength={2}
                                        />
                                    </View>

                                    {valorNumericoTemp > 0 && parcelas ? (
                                        <Text style={styles.installmentPreview}>
                                            Sua dívida será dividida em {parcelas}x de R$ {valorParcelaPreview}
                                        </Text>
                                    ) : null}
                                </View>
                            )}
                        </View>
                    )}

                    {/* CONTA BANCÁRIA */}
                    <Text style={styles.label}>Conta Bancária</Text>
                    <TouchableOpacity style={styles.inputContainer} activeOpacity={0.8} onPress={() => setModalContaVisible(true)}>
                        <View style={[styles.colorDot, { backgroundColor: contaSelecionada ? contaSelecionada.cor : '#4A5980' }]} />
                        <Text style={[styles.inputText, !contaSelecionada && { color: '#4A5980' }]}>
                            {contaSelecionada ? contaSelecionada.nome : 'Selecione a conta...'}
                        </Text>
                        <Feather name="chevron-down" size={20} color="#7B8DB0" />
                    </TouchableOpacity>

                    {/* CATEGORIA */}
                    <Text style={styles.label}>Categoria</Text>
                    <TouchableOpacity style={styles.inputContainer} activeOpacity={0.8} onPress={() => setModalCategoriaVisible(true)}>
                        <View style={[styles.colorDot, { backgroundColor: categoriaSelecionada ? categoriaSelecionada.cor : '#4A5980' }]} />
                        <Text style={[styles.inputText, !categoriaSelecionada && { color: '#4A5980' }]}>
                            {categoriaSelecionada ? categoriaSelecionada.nome : 'Selecione a categoria...'}
                        </Text>
                        <Feather name="chevron-down" size={20} color="#7B8DB0" />
                    </TouchableOpacity>

                    {/* DESCRIÇÃO E DATA */}
                    <Text style={styles.label}>Descrição</Text>
                    <View style={styles.inputContainer}>
                        <Feather name="edit-3" size={20} color="#7B8DB0" style={styles.inputIcon} />
                        <TextInput style={styles.inputText} placeholder="Ex: Mercado..." placeholderTextColor="#4A5980" value={descricao} onChangeText={setDescricao} />
                    </View>

                    {/* RENDERIZAÇÃO CONDICIONAL DA DATA */}
                    {natureza === 'variavel' ? (
                        <>
                            <Text style={styles.label}>
                                {tipo === 'despesa' ? 'Data da Despesa' : 'Data do Recebimento'}
                            </Text>
                            <View style={styles.inputContainer}>
                                <Feather name="calendar" size={20} color="#7B8DB0" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.inputText}
                                    placeholder="DD/MM/AAAA"
                                    placeholderTextColor="#4A5980"
                                    value={data}
                                    onChangeText={handleDataChange}
                                    keyboardType="number-pad"
                                    maxLength={10}
                                />
                            </View>
                        </>
                    ) : (
                        <>
                            <Text style={styles.label}>
                                {tipo === 'despesa' ? 'Dia do Vencimento (Fixo)' : 'Dia do Recebimento (Fixo)'}
                            </Text>
                            <View style={styles.inputContainer}>
                                <Feather name="calendar" size={20} color="#7B8DB0" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.inputText}
                                    placeholder="Ex: 05, 10, 20"
                                    placeholderTextColor="#4A5980"
                                    value={data}
                                    onChangeText={handleDataChange}
                                    keyboardType="number-pad"
                                    maxLength={2}
                                />
                            </View>
                        </>
                    )}

                    <TouchableOpacity style={styles.submitButton} onPress={handleSalvar} activeOpacity={0.8}>
                        <Text style={styles.submitButtonText}>Salvar Lançamento</Text>
                        <Feather name="check" size={20} color="#FFFFFF" />
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>

            {/* MODAL: SELEÇÃO DE CATEGORIAS */}
            <Modal visible={modalCategoriaVisible} transparent={true} animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Escolha a Categoria</Text>
                            <TouchableOpacity onPress={() => setModalCategoriaVisible(false)} style={styles.modalCloseButton}>
                                <Feather name="x" size={24} color="#7B8DB0" />
                            </TouchableOpacity>
                        </View>
                        <FlatList data={categoriasFiltradas} keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.listItem} onPress={() => { setCategoriaSelecionada(item); setModalCategoriaVisible(false); }}>
                                    <View style={[styles.colorDot, { backgroundColor: item.cor }]} />
                                    <Text style={styles.listText}>{item.nome}</Text>
                                </TouchableOpacity>
                            )} />
                    </View>
                </View>
            </Modal>

            {/* MODAL: SELEÇÃO DE CONTAS */}
            <Modal visible={modalContaVisible} transparent={true} animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Qual Conta?</Text>
                            <TouchableOpacity onPress={() => setModalContaVisible(false)} style={styles.modalCloseButton}>
                                <Feather name="x" size={24} color="#7B8DB0" />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={styles.createAccountButton}
                            onPress={() => {
                                setModalContaVisible(false);
                                setTimeout(() => { setModalCriarContaVisible(true); }, 100);
                            }}
                        >
                            <Feather name="plus-circle" size={20} color="#10B981" />
                            <Text style={styles.createAccountText}>Adicionar nova conta</Text>
                        </TouchableOpacity>

                        <FlatList data={contas} keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.listItem} onPress={() => { setContaSelecionada(item); setModalContaVisible(false); }}>
                                    <View style={[styles.colorDot, { backgroundColor: item.cor }]} />
                                    <Text style={styles.listText}>{item.nome}</Text>
                                </TouchableOpacity>
                            )} />
                    </View>
                </View>
            </Modal>

            {/* SUB-MODAL: CRIAR NOVA CONTA */}
            <Modal visible={modalCriarContaVisible} transparent={true} animationType="fade">
                <View style={styles.modalOverlayCentered}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Nova Conta</Text>

                        <TextInput
                            style={styles.modalInput}
                            placeholder="Ex: Nubank, Itaú, Santander..."
                            placeholderTextColor="#4A5980"
                            value={novaContaNome}
                            onChangeText={setNovaContaNome}
                            autoFocus
                        />

                        {/* SELETOR DE COR DA CONTA */}
                        <Text style={styles.labelSmall}>Escolha uma cor identificadora:</Text>
                        <View style={styles.paletteContainer}>
                            {CORES_PALETA.map((cor) => (
                                <TouchableOpacity
                                    key={cor}
                                    style={[
                                        styles.paletteCircle,
                                        { backgroundColor: cor },
                                        novaContaCor === cor && styles.paletteCircleActive
                                    ]}
                                    onPress={() => setNovaContaCor(cor)}
                                    activeOpacity={0.7}
                                />
                            ))}
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.modalActionButton}
                                onPress={() => {
                                    setModalCriarContaVisible(false);
                                    setTimeout(() => { setModalContaVisible(true); }, 100);
                                }}
                            >
                                <Text style={styles.modalActionTextCancel}>Cancelar</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={handleCriarContaRapida} style={styles.modalActionButtonPrimary}>
                                <Text style={styles.modalActionTextConfirm}>Criar</Text>
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
    backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#0B1120', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#1A2540' },
    headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
    typeSelector: { flexDirection: 'row', backgroundColor: '#0B1120', borderRadius: 16, padding: 6, borderWidth: 1, borderColor: '#1A2540', marginBottom: 32 },
    typeButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, gap: 8 },
    typeText: { fontSize: 15, fontWeight: '600', color: '#7B8DB0' },
    typeButtonDespesaActive: { backgroundColor: 'rgba(239, 68, 68, 0.1)' },
    typeButtonReceitaActive: { backgroundColor: 'rgba(16, 185, 129, 0.1)' },
    amountContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 40 },
    currencySymbol: { color: '#7B8DB0', fontSize: 24, fontWeight: 'bold', marginRight: 8, marginTop: 8 },
    amountInput: { fontSize: 48, fontWeight: 'bold', minWidth: 120, textAlign: 'center' },
    label: { color: '#7B8DB0', fontSize: 13, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
    labelSmall: { color: '#4A5980', fontSize: 12, fontWeight: '600', marginBottom: 12, textTransform: 'uppercase' },
    natureSelector: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    natureButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, backgroundColor: '#0B1120', borderWidth: 1, borderColor: '#1A2540', gap: 8 },
    natureButtonActive: { backgroundColor: '#1A2540', borderColor: '#4A5980' },
    natureText: { fontSize: 14, fontWeight: '600', color: '#7B8DB0' },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0B1120', borderRadius: 16, borderWidth: 1, borderColor: '#1A2540', marginBottom: 24, paddingHorizontal: 16, minHeight: 56 },
    inputIcon: { marginRight: 12 },
    inputText: { flex: 1, color: '#FFFFFF', fontSize: 16, paddingVertical: 16 },
    colorDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
    submitButton: { flexDirection: 'row', backgroundColor: '#10B981', borderRadius: 16, paddingVertical: 18, justifyContent: 'center', alignItems: 'center', marginTop: 16, gap: 12 },
    submitButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#0B1120', borderTopLeftRadius: 24, borderTopRightRadius: 24, minHeight: '40%', padding: 24, borderWidth: 1, borderColor: '#1A2540' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    modalTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
    modalCloseButton: { padding: 4 },
    listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#1A2540' },
    listText: { flex: 1, color: '#FFFFFF', fontSize: 16, fontWeight: '500' },

    createAccountButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)' },
    createAccountText: { color: '#10B981', fontSize: 16, fontWeight: 'bold', marginLeft: 12 },

    modalOverlayCentered: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalCard: { backgroundColor: '#0B1120', width: '100%', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#1A2540' },
    modalInput: { backgroundColor: '#1A2540', color: '#FFFFFF', borderRadius: 12, padding: 16, fontSize: 16, marginTop: 8, marginBottom: 20 },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
    modalActionButton: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12 },
    modalActionButtonPrimary: { backgroundColor: '#10B981', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12 },
    modalActionTextCancel: { color: '#7B8DB0', fontSize: 16, fontWeight: 'bold' },
    modalActionTextConfirm: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },

    // Estilos do Seletor de Cores (Palette)
    paletteContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28 },
    paletteCircle: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: 'transparent' },
    paletteCircleActive: { borderColor: '#FFFFFF', transform: [{ scale: 1.1 }] },

    // Estilos de Parcelamento
    installmentContainer: { marginBottom: 24, paddingHorizontal: 4 },
    installmentToggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    installmentLabel: { color: '#7B8DB0', fontSize: 14, fontWeight: '600' },
    toggleTrack: { width: 44, height: 24, backgroundColor: '#1A2540', borderRadius: 12, padding: 2, justifyContent: 'center' },
    toggleTrackActive: { backgroundColor: '#10B981' },
    toggleThumb: { width: 20, height: 20, backgroundColor: '#7B8DB0', borderRadius: 10 },
    toggleThumbActive: { backgroundColor: '#FFFFFF', transform: [{ translateX: 20 }] },
    installmentPreview: { color: '#10B981', fontSize: 13, fontWeight: '600', textAlign: 'center', marginTop: -12, marginBottom: 8 },
});