from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash
from database import db
from models import User

users_bp = Blueprint('users', __name__)

@users_bp.route('/', methods=['POST'])
def create_user():
    data = request.get_json()

    if not data or not data.get('nome') or not data.get('email') or not data.get('senha'):
        return jsonify({"erro": "Nome, email e senha são obrigatórios!"}), 400

    if User.query.filter_by(email=data['email']).first():
        return jsonify({"erro": "Este email já está cadastrado."}), 409

    novo_usuario = User(
        nome=data['nome'],
        email=data['email'],
        password_hash=generate_password_hash(data['senha'])
    )

    db.session.add(novo_usuario)
    db.session.commit()
    
    # Força a atualização do objeto com os dados gerados pelo banco (como o ID)
    db.session.refresh(novo_usuario)

    # Retorno padronizado e direto
    return jsonify({
        "mensagem": "Usuário criado com sucesso!",
        "id": novo_usuario.id
    }), 201

@users_bp.route('/', methods=['GET'])
def get_users():
    usuarios = User.query.all()
    return jsonify([{
        "id": u.id, 
        "nome": u.nome, 
        "email": u.email
    } for u in usuarios]), 200