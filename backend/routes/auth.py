from flask import Blueprint, request, jsonify
from werkzeug.security import check_password_hash
from flask_jwt_extended import create_access_token
from models import User

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('senha'):
        return jsonify({"erro": "Email e senha são obrigatórios!"}), 400

    # Busca o usuário no banco
    user = User.query.filter_by(email=data['email']).first()

    # Verifica se existe e se a senha criptografada bate
    if user and check_password_hash(user.password_hash, data['senha']):
        # Gera o token de acesso que vale como um "crachá"
        token = create_access_token(identity=str(user.id))
        return jsonify({
            "mensagem": "Login realizado com sucesso!",
            "token": token
        }), 200

    return jsonify({"erro": "Email ou senha incorretos"}), 401