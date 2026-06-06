from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash
from database import db
from models import User

# Cria o Blueprint para os usuários
users_bp = Blueprint('users', __name__)

# Note que agora usamos @users_bp em vez de @app
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

    return jsonify({
        "mensagem": "Usuário criado com sucesso!",
        "usuario": {
            "id": novo_usuario.id,
            "nome": novo_usuario.nome,
            "email": novo_usuario.email
        }
    }), 201