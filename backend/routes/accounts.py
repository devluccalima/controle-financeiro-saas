from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
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

@accounts_bp.route('/<account_id>', methods=['DELETE'])
@jwt_required()
def delete_account(account_id):
    conta = Account.query.get(account_id)
    if not conta:
        return jsonify({"erro": "Conta não encontrada"}), 404

    db.session.delete(conta)
    db.session.commit()
    return jsonify({"mensagem": "Conta excluída com sucesso!"}), 200