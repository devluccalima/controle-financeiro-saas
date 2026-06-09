import uuid
import calendar
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity # CORREÇÃO: Adicionado get_jwt_identity
from database import db
from models import Transaction, Account # CORREÇÃO: Adicionado Account
from sqlalchemy import extract

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
    transacao = Transaction.query.filter_by(id=transaction_id, user_id=user_id, deleted_at=None).first()
    
    if not transacao:
        return jsonify({"erro": "Transação não encontrada ou acesso negado"}), 404

    data = request.get_json()

    # Atualiza todos os campos possíveis
    if 'descricao' in data: transacao.descricao = data['descricao']
    if 'valor' in data: transacao.valor = data['valor']
    if 'pago' in data: transacao.pago = data['pago']
    if 'tipo' in data: transacao.tipo = data['tipo']
    if 'natureza' in data: transacao.natureza = data['natureza']
    if 'category_id' in data: transacao.category_id = data['category_id']
    if 'account_id' in data: transacao.account_id = data['account_id']
    
    # Formatação de Data no PUT
    if 'data' in data:
        try:
            if transacao.natureza == 'fixa':
                dia = min(int(data['data']), 28) 
                hoje = datetime.now()
                transacao.data_vencimento = datetime(hoje.year, hoje.month, dia).date()
            else:
                transacao.data_vencimento = datetime.strptime(data['data'], '%d/%m/%Y').date()
        except ValueError:
            pass # Ignora se a data vier mal formatada

    db.session.commit()
    return jsonify({"mensagem": "Transação atualizada com sucesso!"}), 200

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