import uuid
import calendar
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity # CORREÇÃO: Adicionado get_jwt_identity
from database import db
from models import Transaction, Account, Category 
from sqlalchemy import extract, func
import re

transactions_bp = Blueprint('transactions', __name__)

# Função auxiliar para somar meses corretamente
def add_months(sourcedate, months):
    month = sourcedate.month - 1 + months
    year = sourcedate.year + month // 12
    month = month % 12 + 1
    day = min(sourcedate.day, calendar.monthrange(year, month)[1])
    return datetime(year, month, day).date()

@transactions_bp.route('/', methods=['POST'])
@jwt_required()
def create_transaction():
    user_id = get_jwt_identity()
    dados = request.json

    try:
        data_recebida = dados.get('data')
        natureza = dados.get('natureza')
        tipo = dados.get('tipo')
        account_id = dados.get('account_id')
        category_id = dados.get('category_id')
        valor_total = float(dados.get('valor', 0))
        descricao_base = dados.get('descricao', '')
        
        is_parcelado = dados.get('is_parcelado', False)
        total_parcelas = int(dados.get('total_parcelas', 1))

        # Verifica se a conta e categoria pertencem a este usuário
        conta = Account.query.filter_by(id=account_id, user_id=user_id).first()
        if not conta:
            return jsonify({"erro": "Conta bancária inválida ou não pertence ao usuário."}), 400

        # Lógica de Data Base
        hoje = datetime.now()
        if natureza == 'fixa':
            dia = min(int(data_recebida), 28) 
            data_base = datetime(hoje.year, hoje.month, dia).date()
        else:
            data_base = datetime.strptime(data_recebida, '%d/%m/%Y').date()

        # ==========================================
        # MOTOR DE PARCELAMENTO
        # ==========================================
        if is_parcelado and total_parcelas > 1:
            valor_parcela = valor_total / total_parcelas
            grupo_id = str(uuid.uuid4()) # Cria um ID único para amarrar todas as faturas

            for i in range(total_parcelas):
                data_vencimento_parcela = add_months(data_base, i)
                
                nova_transacao = Transaction(
                    user_id=user_id,
                    account_id=account_id,
                    category_id=category_id,
                    tipo=tipo,
                    natureza=natureza,
                    descricao=f"{descricao_base} ({i+1}/{total_parcelas})", # Ex: Decolar (1/8)
                    valor=valor_parcela,
                    data_vencimento=data_vencimento_parcela,
                    pago=True if (tipo == 'despesa' and i == 0) else False, # Assume a primeira paga e o resto pendente
                    parcela_atual=i+1,
                    total_parcelas=total_parcelas,
                    grupo_parcelamento_id=grupo_id
                )
                db.session.add(nova_transacao)
        else:
            # LANÇAMENTO NORMAL (À Vista / Fixo)
            nova_transacao = Transaction(
                user_id=user_id,
                account_id=account_id,
                category_id=category_id,
                tipo=tipo,
                natureza=natureza,
                descricao=descricao_base,
                valor=valor_total,
                data_vencimento=data_base,
                pago=True if tipo == 'despesa' else False
            )
            db.session.add(nova_transacao)

        db.session.commit()
        return jsonify({"mensagem": "Transação salva com sucesso!"}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"erro": f"Falha ao processar transação: {str(e)}"}), 500
    
@transactions_bp.route('/', methods=['GET'])
@jwt_required() # CORREÇÃO: Protegendo a rota com Token
def get_transactions():
    user_id = get_jwt_identity()
    mes = request.args.get('mes')
    ano = request.args.get('ano')

    # Filtra transações do usuário no mês e ano selecionado
    query = Transaction.query.filter_by(user_id=user_id, deleted_at=None)
    
    if mes and ano:
        query = query.filter(
            extract('month', Transaction.data_vencimento) == int(mes),
            extract('year', Transaction.data_vencimento) == int(ano)
        )

    query = query.order_by(
        Transaction.data_vencimento.desc(), 
        Transaction.id.desc()
    )

    transacoes = query.all()
    
    return jsonify([{
        "id": t.id,
        "descricao": t.descricao,
        "valor": float(t.valor),
        "tipo": t.tipo,
        "pago": t.pago, # Retornar o status de pago ajuda no Dashboard
        "data_vencimento": t.data_vencimento.isoformat(),
        "categoria_nome": t.category.nome if t.category else 'Sem Categoria',
        "categoria_icone": t.category.icone,
        "categoria_cor": t.category.cor,
        "conta_nome": t.account.nome if t.account else 'Sem Conta',
        "total_parcelas": t.total_parcelas,
        "parcela_atual": t.parcela_atual
    } for t in transacoes]), 200

@transactions_bp.route('/<transaction_id>', methods=['GET'])
@jwt_required()
def get_single_transaction(transaction_id):
    user_id = get_jwt_identity()
    
    # Busca a transação garantindo que é do usuário e não foi excluída
    transacao = Transaction.query.filter_by(id=transaction_id, user_id=user_id, deleted_at=None).first()
    
    if not transacao:
        return jsonify({"erro": "Transação não encontrada"}), 404

    # Tratamento contra valores Nulos (None) do Banco
    total_parcelas_seguro = transacao.total_parcelas if transacao.total_parcelas is not None else 1

    return jsonify({
        "id": transacao.id,
        "descricao": transacao.descricao,
        "valor": float(transacao.valor),
        "tipo": transacao.tipo,
        "natureza": transacao.natureza,
        "data_vencimento": transacao.data_vencimento.isoformat(),
        "account_id": transacao.account_id,
        "category_id": transacao.category_id,
        "pago": transacao.pago,
        "is_parcelado": total_parcelas_seguro > 1,
        "total_parcelas": total_parcelas_seguro
    }), 200

@transactions_bp.route('/<transaction_id>', methods=['PUT'])
@jwt_required()
def update_transaction(transaction_id):
    user_id = get_jwt_identity()
    data = request.json
    
    # 1. Encontra a transação original
    transacao = Transaction.query.filter_by(id=transaction_id, user_id=user_id).first()
    if not transacao:
        return jsonify({"erro": "Transação não encontrada"}), 404

    # 2. Limpeza Inteligente da Descrição
    # Remove qualquer coisa como " (1/10)" do final da string que o front-end mandar
    nova_descricao = data.get('descricao', transacao.descricao)
    nova_descricao_limpa = re.sub(r'\s*\(\d+/\d+\)$', '', nova_descricao).strip()

    # 3. Lógica de Cascata (Para transações Parceladas)
    if transacao.grupo_parcelamento_id:
        transacoes_grupo = Transaction.query.filter_by(
            grupo_parcelamento_id=transacao.grupo_parcelamento_id, 
            user_id=user_id
        ).all()
        
        for t in transacoes_grupo:
            t.descricao = nova_descricao_limpa
            t.valor = data.get('valor', t.valor)
            t.category_id = data.get('category_id', t.category_id)
            t.account_id = data.get('account_id', t.account_id)
            # NOTA: Não mexemos na data_vencimento aqui para não jogar 
            # todas as parcelas pro mesmo mês. O vencimento segue o original de cada uma.
            
    else:
        # 4. Lógica Simples (Para transações Únicas)
        transacao.descricao = nova_descricao_limpa
        transacao.valor = data.get('valor', transacao.valor)
        transacao.category_id = data.get('category_id', transacao.category_id)
        transacao.account_id = data.get('account_id', transacao.account_id)
        
        # Só mudamos a data se for transação única
        if 'data_vencimento' in data:
            transacao.data_vencimento = data['data_vencimento']

    # Se mandou o status de 'pago'
    if 'pago' in data:
        transacao.pago = data['pago']

    db.session.commit()
    
    return jsonify({"mensagem": "Transação atualizada com sucesso"}), 200

@transactions_bp.route('/<transaction_id>', methods=['DELETE'])
@jwt_required()
def delete_transaction(transaction_id):
    user_id = get_jwt_identity()
    
    # CORREÇÃO: Garante que a transação pertence ao usuário logado
    transacao = Transaction.query.filter_by(id=transaction_id, user_id=user_id).first()
    
    if not transacao:
        return jsonify({"erro": "Transação não encontrada ou acesso negado"}), 404

    if transacao.grupo_parcelamento_id:
        Transaction.query.filter_by(
            grupo_parcelamento_id=transacao.grupo_parcelamento_id, 
            user_id=user_id
        ).update({"deleted_at": datetime.now(timezone.utc)})
    else:
        # Se for um lançamento 'unico', deleta apenas ele
        transacao.deleted_at = datetime.now(timezone.utc)

    db.session.commit()

    return jsonify({"mensagem": "Transação(ões) excluída(s) com sucesso"}), 200

@transactions_bp.route('/relatorios/categorias', methods=['GET'])
@jwt_required()
def relatorio_gastos_por_categoria():
    user_id = get_jwt_identity()
    mes = request.args.get('mes')
    ano = request.args.get('ano')
    tipo = request.args.get('tipo', 'despesa') # Por padrão, foca em despesas

    # Monta a consulta juntando Transação com Categoria
    query = db.session.query(
        Category.nome.label('categoria_nome'),
        func.sum(Transaction.valor).label('total_gasto')
    ).join(
        Category, Transaction.category_id == Category.id
    ).filter(
        Transaction.user_id == user_id,
        Transaction.deleted_at == None,
        Transaction.tipo == tipo
    )

    # Filtra por mês e ano, se foram enviados
    if mes and ano:
        query = query.filter(
            extract('month', Transaction.data_vencimento) == int(mes),
            extract('year', Transaction.data_vencimento) == int(ano)
        )

    # Agrupa os resultados pelo nome da categoria
    resultados = query.group_by(Category.nome).all()

    # Formata a resposta e calcula as porcentagens
    dados = []
    total_geral = sum([r.total_gasto for r in resultados]) if resultados else 0

    for r in resultados:
        total_categoria = float(r.total_gasto)
        percentual = round((total_categoria / float(total_geral)) * 100, 1) if total_geral > 0 else 0
        
        dados.append({
            "categoria": r.categoria_nome,
            "total": total_categoria,
            "percentual": percentual
        })

    # Ordena para que a categoria com maior gasto apareça primeiro
    dados = sorted(dados, key=lambda x: x['total'], reverse=True)

    return jsonify({
        "total_geral": float(total_geral),
        "dados": dados
    }), 200