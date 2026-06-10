from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db
from models import Account

accounts_bp = Blueprint('accounts', __name__)

@accounts_bp.route('/', methods=['POST'])
@jwt_required()
def create_account():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    nova_conta = Account(
        user_id=user_id,
        nome=data['nome'],
        cor=data.get('cor', '#3B82F6')
    )
    db.session.add(nova_conta)
    db.session.commit()
    
    return jsonify({"mensagem": "Conta criada!", "id": nova_conta.id}), 201

@accounts_bp.route('/', methods=['GET'])
@jwt_required()
def get_accounts():
    user_id = get_jwt_identity()
    contas = Account.query.filter_by(user_id=user_id).all()
    
    return jsonify([{
        "id": c.id, 
        "nome": c.nome, 
        "cor": getattr(c, 'cor', '#3B82F6') # getattr previne erro se a coluna for nula
    } for c in contas]), 200

@accounts_bp.route('/<account_id>', methods=['PUT'])
@jwt_required()
def update_account(account_id):
    user_id = get_jwt_identity()
    data = request.get_json()
    
    conta = Account.query.filter_by(id=account_id, user_id=user_id).first()
    if not conta:
        return jsonify({"erro": "Conta não encontrada ou sem permissão"}), 404

    conta.nome = data.get('nome', conta.nome)
    conta.cor = data.get('cor', conta.cor)
    db.session.commit()

    return jsonify({
        "id": conta.id, 
        "nome": conta.nome, 
        "cor": getattr(conta, 'cor', '#3B82F6') # getattr previne erro se a coluna for nula
    }), 200

@accounts_bp.route('/<account_id>', methods=['DELETE'])
@jwt_required()
def delete_account(account_id):
    user_id = get_jwt_identity()
    conta = Account.query.filter_by(id=account_id, user_id=user_id).first()
    
    if not conta:
        return jsonify({"erro": "Conta não encontrada ou sem permissão"}), 404

    db.session.delete(conta)
    db.session.commit()
    return jsonify({"mensagem": "Conta excluída com sucesso!"}), 200