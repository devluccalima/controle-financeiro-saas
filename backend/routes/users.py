from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db
from models import User, Category

users_bp = Blueprint('users', __name__)

CATEGORIAS_PADRAO = [
    {"nome": "Lazer", "tipo": "despesa", "cor": "#F59E0B", "icone": "smile"}, 
    {"nome": "Transporte", "tipo": "despesa", "cor": "#3B82F6", "icone": "navigation"}, 
    {"nome": "Moradia", "tipo": "despesa", "cor": "#8B5CF6", "icone": "home"},
    {"nome": "Saúde", "tipo": "despesa", "cor": "#EC4899", "icone": "heart"}, 
    {"nome": "Educação", "tipo": "despesa", "cor": "#06B6D4", "icone": "book"}, 
    {"nome": "Dívidas", "tipo": "despesa", "cor": "#EF4444", "icone": "alert-circle"}, 
    {"nome": "Salário", "tipo": "receita", "cor": "#10B981", "icone": "dollar-sign"},
    {"nome": "Investimentos", "tipo": "receita", "cor": "#14B8A6", "icone": "trending-up"}
]

@users_bp.route('', methods=['POST'])
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
    db.session.flush()  # Garante que o ID seja gerado antes de criar as categorias

    for cat in CATEGORIAS_PADRAO:
        nova_categoria = Category(
            user_id=novo_usuario.id, # Vincula ao usuário recém-criado
            nome=cat['nome'],
            icone=cat['icone'],
            cor=cat['cor'],
            tipo=cat['tipo']
        )
        db.session.add(nova_categoria)

    db.session.commit()
    
    # Força a atualização do objeto com os dados gerados pelo banco (como o ID)
    db.session.refresh(novo_usuario)

    # Retorno padronizado e direto
    return jsonify({
        "mensagem": "Usuário criado com sucesso e categorias iniciais criadas!",
        "id": novo_usuario.id
    }), 201

@users_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_my_profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id) # Atenção: se o seu modelo for Usuario, troque aqui
    
    if not user:
        return jsonify({"erro": "Usuário não encontrado."}), 404
        
    return jsonify({
        "id": user.id,
        "nome": user.nome,
        "email": user.email
    }), 200

@users_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        return jsonify({"erro": "Usuário não encontrado."}), 404

    data = request.get_json()

    novo_nome = data.get('nome')
    novo_email = data.get('email')
    senha_atual = data.get('senha_atual')
    nova_senha = data.get('nova_senha')

    # 2. Atualiza o Nome
    if novo_nome:
        user.nome = novo_nome

    # 3. Atualiza o E-mail (com validação de duplicidade)
    if novo_email and novo_email != user.email:
        email_existente = User.query.filter_by(email=novo_email).first()
        if email_existente:
            return jsonify({"erro": "Este e-mail já está em uso por outra conta."}), 400
        user.email = novo_email

    # 4. Atualiza a Senha (com validação de segurança)
    if nova_senha:
        if not senha_atual:
            return jsonify({"erro": "Para alterar a senha, é necessário informar a senha atual."}), 400
        
        # Compara a senha digitada com o Hash salvo no banco
        if not check_password_hash(user.password_hash, senha_atual):
            return jsonify({"erro": "A senha atual está incorreta."}), 401
        
        # Gera o Hash da nova senha para salvar com segurança
        user.password_hash = generate_password_hash(nova_senha)

    # 5. Salva no banco de dados
    try:
        db.session.commit()
        return jsonify({
            "mensagem": "Perfil atualizado com sucesso!",
            "usuario": {
                "id": user.id,
                "nome": user.nome,
                "email": user.email
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Erro ao atualizar perfil: {e}")
        return jsonify({"erro": "Erro interno ao salvar os dados. Tente novamente."}), 500