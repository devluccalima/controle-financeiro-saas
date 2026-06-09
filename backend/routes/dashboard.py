from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from sqlalchemy import extract, func
from models import db, Transaction # Ajuste o import do seu model conforme a sua estrutura


dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/resumo', methods=['GET'])
@jwt_required() # Protege a rota: só entra quem tem a chave (Token JWT)
def get_resumo():
    user_id = get_jwt_identity()
    mes = request.args.get('mes')
    ano = request.args.get('ano')

    # Filtra apenas transações não deletadas
    query = Transaction.query.filter_by(user_id=user_id, deleted_at=None)
    
    if mes and ano:
        query = query.filter(
            extract('month', Transaction.data_vencimento) == int(mes),
            extract('year', Transaction.data_vencimento) == int(ano)
        )
    
    transacoes = query.all()
    
    receitas = sum(float(t.valor) for t in transacoes if t.tipo == 'receita')
    despesas = sum(float(t.valor) for t in transacoes if t.tipo == 'despesa')
    
    return jsonify({
        "receitas": receitas,
        "despesas": despesas,
        "saldo": receitas - despesas
    }), 200