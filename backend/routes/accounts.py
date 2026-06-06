from flask import Blueprint, request, jsonify
from database import db
from models import Account

accounts_bp = Blueprint('accounts', __name__)

@accounts_bp.route('/', methods=['POST'])
def create_account():
    data = request.get_json()
    nova_conta = Account(
        user_id=data['user_id'],
        nome=data['nome'],
        tipo=data['tipo']
    )
    db.session.add(nova_conta)
    db.session.commit()
    return jsonify({"mensagem": "Conta criada!", "id": nova_conta.id}), 201

@accounts_bp.route('/', methods=['GET'])
def get_accounts():
    contas = Account.query.all()
    return jsonify([{
        "id": c.id, 
        "nome": c.nome, 
        "tipo": c.tipo
    } for c in contas]), 200