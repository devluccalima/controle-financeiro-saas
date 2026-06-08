from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db
from models import Account

accounts_bp = Blueprint('accounts', __name__)

@accounts_bp.route('/', methods=['POST'])
@jwt_required()
def create_account():
    # 1. Pega o ID de forma 100% segura pelo Token de login
    user_id = get_jwt_identity() 
    data = request.get_json()
    
    # 2. Cria a conta puxando a Cor que o App agora envia
    nova_conta = Account(
        user_id=user_id,
        nome=data['nome'],
        cor=data.get('cor', '#8A05BE') 
    )
    
    db.session.add(nova_conta)
    db.session.commit()
    return jsonify({"mensagem": "Conta criada!", "id": nova_conta.id, "nome": nova_conta.nome}), 201

@accounts_bp.route('/', methods=['GET'])
@jwt_required()
def get_accounts():
    user_id = get_jwt_identity()
    
    # Traz APENAS as contas deste usuário
    contas = Account.query.filter_by(user_id=user_id).all()
    
    # Devolve também a cor para o App conseguir renderizar a bolinha colorida
    return jsonify([{
        "id": c.id, 
        "nome": c.nome, 
        "cor": c.cor
    } for c in contas]), 200

@accounts_bp.route('/<account_id>', methods=['DELETE'])
@jwt_required()
def delete_account(account_id):
    user_id = get_jwt_identity()
    
    # Garante que a conta existe E pertence ao usuário logado
    conta = Account.query.filter_by(id=account_id, user_id=user_id).first()
    
    if not conta:
        return jsonify({"erro": "Conta não encontrada ou acesso negado"}), 404

    db.session.delete(conta)
    db.session.commit()
    return jsonify({"mensagem": "Conta excluída com sucesso!"}), 200