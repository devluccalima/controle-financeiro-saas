import uuid
import calendar
from datetime import datetime
from flask import Blueprint, request, jsonify
from database import db
from models import Transaction

transactions_bp = Blueprint('transactions', __name__)

# Função auxiliar para somar meses corretamente
def add_months(sourcedate, months):
    month = sourcedate.month - 1 + months
    year = sourcedate.year + month // 12
    month = month % 12 + 1
    day = min(sourcedate.day, calendar.monthrange(year, month)[1])
    return datetime(year, month, day).date()

@transactions_bp.route('/', methods=['POST'])
def create_transaction():
    data = request.get_json()

    # Validação básica dos campos obrigatórios
    required_fields = ['user_id', 'account_id', 'category_id', 'descricao', 'valor', 'data_vencimento']
    if not all(field in data for field in required_fields):
        return jsonify({"erro": "Campos obrigatórios faltando!"}), 400

    try:
        data_venc_inicial = datetime.strptime(data['data_vencimento'], '%Y-%m-%d').date()
        tipo = data.get('tipo_lancamento', 'unico')
        
        # Cenário 1: Compra Parcelada
        if tipo == 'parcelado':
            total_parcelas = int(data.get('total_parcelas', 1))
            grupo_id = str(uuid.uuid4()) # Une todas as parcelas
            
            # Divide o valor total pelo número de parcelas
            valor_parcela = float(data['valor']) / total_parcelas
            
            novas_transacoes = []
            for i in range(total_parcelas):
                nova_data = add_months(data_venc_inicial, i)
                transacao = Transaction(
                    user_id=data['user_id'],
                    account_id=data['account_id'],
                    category_id=data['category_id'],
                    descricao=f"{data['descricao']} ({i+1}/{total_parcelas})",
                    valor=valor_parcela,
                    data_vencimento=nova_data,
                    tipo_lancamento='parcelado',
                    grupo_parcelamento_id=grupo_id,
                    parcela_atual=i+1,
                    total_parcelas=total_parcelas
                )
                novas_transacoes.append(transacao)
                db.session.add(transacao)
                
            db.session.commit()
            return jsonify({
                "mensagem": f"{total_parcelas} parcelas geradas com sucesso!",
                "grupo_id": grupo_id
            }), 201

        # Cenário 2: Compra Única ou Fixa
        else:
            nova_transacao = Transaction(
                user_id=data['user_id'],
                account_id=data['account_id'],
                category_id=data['category_id'],
                descricao=data['descricao'],
                valor=data['valor'],
                data_vencimento=data_venc_inicial,
                tipo_lancamento=tipo
            )
            db.session.add(nova_transacao)
            db.session.commit()
            
            return jsonify({
                "mensagem": "Transação criada com sucesso!",
                "id": nova_transacao.id
            }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"erro": str(e)}), 500
    
@transactions_bp.route('/', methods=['GET'])
def get_transactions():
    # Ordena para mostrar as faturas mais antigas primeiro
    transacoes = Transaction.query.order_by(Transaction.data_vencimento).all()
    
    return jsonify([{
        "id": t.id,
        "descricao": t.descricao,
        "valor": float(t.valor), # Converte Numeric para float pro JSON
        "data_vencimento": t.data_vencimento.strftime('%Y-%m-%d'),
        "tipo_lancamento": t.tipo_lancamento,
        "parcela_atual": t.parcela_atual,
        "total_parcelas": t.total_parcelas,
        "grupo_id": t.grupo_parcelamento_id
    } for t in transacoes]), 200