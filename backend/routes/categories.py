from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from database import db
from models import Category

categories_bp = Blueprint('categories', __name__)

@categories_bp.route('/', methods=['POST'])
def create_category():
    data = request.get_json()
    nova_categoria = Category(
        user_id=data['user_id'],
        nome=data['nome'],
        tipo=data['tipo']
    )
    db.session.add(nova_categoria)
    db.session.commit()
    return jsonify({"mensagem": "Categoria criada!", "id": nova_categoria.id}), 201

@categories_bp.route('/', methods=['GET'])
def get_categories():
    categorias = Category.query.all()
    return jsonify([{
        "id": c.id, 
        "nome": c.nome, 
        "tipo": c.tipo
    } for c in categorias]), 200

@categories_bp.route('/<category_id>', methods=['DELETE'])
@jwt_required()
def delete_category(category_id):
    categoria = Category.query.get(category_id)
    if not categoria:
        return jsonify({"erro": "Categoria não encontrada"}), 404

    db.session.delete(categoria)
    db.session.commit()
    return jsonify({"mensagem": "Categoria excluída com sucesso!"}), 200