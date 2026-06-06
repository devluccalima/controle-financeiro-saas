from flask import Blueprint, request, jsonify
from sqlalchemy import extract
from database import db
from models import Transaction, Category

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/resumo', methods=['GET'])
def get_resumo():
    user_id = request.args.get('user_id')
    mes = request.args.get('mes')
    ano = request.args.get('ano')

    if not all([user_id, mes, ano]):
        return jsonify({"erro": "Parâmetros 'user_id', 'mes' e 'ano' são obrigatórios na URL"}), 400

    # Busca as transações do usuário naquele mês/ano específico e junta com a tabela de categorias para saber o que é receita ou despesa
    query = db.session.query(Transaction, Category).join(Category).filter(
        Transaction.user_id == user_id,
        extract('month', Transaction.data_vencimento) == int(mes),
        extract('year', Transaction.data_vencimento) == int(ano)
    ).all()

    total_receitas = 0.0
    total_despesas = 0.0
    total_pendente = 0.0

    for transacao, categoria in query:
        valor = float(transacao.valor)
        if categoria.tipo == 'receita':
            total_receitas += valor
        elif categoria.tipo == 'despesa':
            total_despesas += valor
            if not transacao.pago:
                total_pendente += valor

    saldo_livre = total_receitas - total_despesas

    return jsonify({
        "mes": mes,
        "ano": ano,
        "total_receitas": round(total_receitas, 2),
        "total_despesas": round(total_despesas, 2),
        "total_pendente": round(total_pendente, 2),
        "saldo_livre": round(saldo_livre, 2)
    }), 200