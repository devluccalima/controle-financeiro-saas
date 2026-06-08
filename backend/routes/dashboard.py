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

    # Base da query
    base_query = Transaction.query.filter_by(user_id=user_id)
    
    if mes and ano:
        base_query = base_query.filter(
            extract('month', Transaction.data_vencimento) == int(mes),
            extract('year', Transaction.data_vencimento) == int(ano)
        )

    # Soma Entradas e Saídas
    receitas = base_query.filter_by(tipo='receita').with_entities(func.sum(Transaction.valor)).scalar() or 0
    despesas = base_query.filter_by(tipo='despesa').with_entities(func.sum(Transaction.valor)).scalar() or 0

    return jsonify({
        "receitas": float(receitas),
        "despesas": float(despesas),
        "saldo_livre": float(receitas - despesas)
    }), 200