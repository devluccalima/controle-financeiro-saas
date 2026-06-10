from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db
from models import Category

categories_bp = Blueprint('categories', __name__)

@categories_bp.route('/', methods=['POST'])
@jwt_required() # Tranca a rota: só logado entra
def create_category():
    user_id = get_jwt_identity() # Pega o ID com segurança de dentro do Token
    data = request.get_json()
    
    nova_categoria = Category(
        user_id=user_id, # Usa o ID seguro, não o do request
        nome=data['nome'],
        tipo=data.get('tipo', 'despesa'), # Pega o tipo, mas se vier vazio assume 'despesa'
        icone=data.get('icone', 'tag'),  # Pega o ícone ou usa o padrão
        cor=data.get('cor', '#10B981') # Pega a cor ou usa o padrão (verde)
    )
    db.session.add(nova_categoria)
    db.session.commit()
    
    return jsonify({"mensagem": "Categoria criada!", "id": nova_categoria.id}), 201

@categories_bp.route('/', methods=['GET'])
@jwt_required() # Tranca a rota
def get_categories():
    user_id = get_jwt_identity() # Descobre quem é
    
    # Filtra: Traz APENAS as categorias do usuário logado
    categorias = Category.query.filter_by(user_id=user_id).all()
    
    return jsonify([{
        "id": c.id, 
        "nome": c.nome, 
        "tipo": c.tipo,
        "icone": c.icone,
        "cor": c.cor
    } for c in categorias]), 200

@categories_bp.route('/<category_id>', methods=['DELETE'])
@jwt_required()
def delete_category(category_id):
    user_id = get_jwt_identity()
    
    # Busca a categoria garantindo que pertence ao usuário logado
    categoria = Category.query.filter_by(id=category_id, user_id=user_id).first()
    
    if not categoria:
        return jsonify({"erro": "Categoria não encontrada ou você não tem permissão"}), 404

    db.session.delete(categoria)
    db.session.commit()
    
    return jsonify({"mensagem": "Categoria excluída com sucesso!"}), 200

@categories_bp.route('/<category_id>', methods=['PUT'])
@jwt_required()
def update_category(category_id):
    user_id = get_jwt_identity()
    data = request.get_json()
    
    # Busca a categoria garantindo que pertence ao usuário logado
    categoria = Category.query.filter_by(id=category_id, user_id=user_id).first()
    
    if not categoria:
        return jsonify({"erro": "Categoria não encontrada ou sem permissão"}), 404

    # Atualiza os dados se eles foram enviados, senão mantém os originais
    categoria.nome = data.get('nome', categoria.nome)
    categoria.icone = data.get('icone', categoria.icone)
    categoria.cor = data.get('cor', categoria.cor)
    # Não atualizamos o 'tipo' para evitar bagunçar transações antigas

    db.session.commit()
    
    return jsonify({"mensagem": "Categoria atualizada com sucesso!"}), 200