from flask import Blueprint, request, jsonify
from werkzeug.security import check_password_hash, generate_password_hash
from flask_jwt_extended import create_access_token
from models import User
from flask_mail import Message
from database import db
from extensions import mail
from datetime import datetime, timedelta
import random

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

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    email = data.get('email')

    if not email:
        return jsonify({"erro": "Email é obrigatório!"}), 400
    
    user = User.query.filter_by(email=email).first() # Adicione deleted_at=None se usar soft delete
    
    # MENSAGEM PADRÃO INDEPENDENTE SE O USUÁRIO EXISTE OU NÃO (Segurança)
    mensagem_sucesso = "Se este e-mail estiver cadastrado, você receberá as instruções de redefinição em instantes."

    if user:
        # 1. Gera código numérico de 6 dígitos
        codigo_recuperacao = str(random.randint(100000, 999999))
        validade = datetime.utcnow() + timedelta(minutes=15)

        user.reset_token = codigo_recuperacao
        user.reset_token_expiration = validade
        
        try:
            db.session.commit()
            
            # 2. Monta o Deep Link do aplicativo
            deep_link = f"vyncefinance://reset-password?token={codigo_recuperacao}&email={email}"
            
            # 3. Dispara o e-mail
            msg = Message(
                subject="Vynce Finance - Redefinição de Senha",
                sender="onboarding@resend.dev",
                recipients=[user.email],
                body=f"Olá {user.nome},\n\nRecebemos um pedido para redefinir sua senha.\n\n"
                     f"Seu código numérico é: {codigo_recuperacao}\n\n"
                     f"Ou, se estiver no celular, clique no link abaixo para abrir o aplicativo diretamente na tela de redefinição:\n{deep_link}\n\n"
                     f"Este código expira em 15 minutos. Se você não solicitou isso, ignore este e-mail."
            )
            mail.send(msg)
            
        except Exception as e:
            db.session.rollback()
            print(f"Erro ao enviar e-mail: {e}")
            # Retorna 200 mesmo em falha para evitar enumeração de usuários
            
            return jsonify({"erro_fatal_python": str(e)}), 500

    return jsonify({"mensagem": mensagem_sucesso}), 200

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    email = data.get('email')
    token = data.get('token')
    nova_senha = data.get('nova_senha')

    if not all([email, token, nova_senha]):
        return jsonify({"erro": "E-mail, token e nova senha são obrigatórios."}), 400

    user = User.query.filter_by(email=email).first()

    # Validações
    if not user:
        return jsonify({"erro": "Dados inválidos."}), 400

    if user.reset_token != token:
        return jsonify({"erro": "Código de recuperação inválido."}), 400

    if not user.reset_token_expiration or datetime.utcnow() > user.reset_token_expiration:
        return jsonify({"erro": "O código de recuperação expirou. Solicite um novo."}), 400

    # Sucesso: Atualiza a senha e limpa o token
    user.password_hash = generate_password_hash(nova_senha) # Confirme se sua coluna de senha chama 'senha' ou 'password'
    user.reset_token = None
    user.reset_token_expiration = None

    try:
        db.session.commit()
        return jsonify({"mensagem": "Senha alterada com sucesso! Você já pode fazer login."}), 200
    except Exception as e:
        db.session.rollback()
        print(f"Erro ao redefinir senha: {e}")
        return jsonify({"erro": "Erro interno ao atualizar a senha. Tente novamente."}), 500