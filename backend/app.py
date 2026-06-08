import os
from flask import Flask, jsonify
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager

from database import db

# Importa as rotas modularizadas
from routes.users import users_bp
from routes.transactions import transactions_bp
from routes.accounts import accounts_bp
from routes.categories import categories_bp
from routes.dashboard import dashboard_bp
from routes.auth import auth_bp

app = Flask(__name__)
migrate = Migrate() # Instanciamos apenas o Migrate

# Evita erros de rota com ou sem barra no final (Ex: /transactions ou /transactions/)
app.url_map.strict_slashes = False

# Configurações
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'postgresql://root:rootpassword@db:5432/finance_saas')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'super-chave-secreta-do-saas-muito-segura-123'

# 2. Inicializa TUDO no escopo global do app (Importante para o Docker)
db.init_app(app)
migrate.init_app(app, db) # O Migrate foi movido para cá
jwt = JWTManager(app)

# Registra os Blueprints
app.register_blueprint(users_bp, url_prefix='/users')
app.register_blueprint(transactions_bp, url_prefix='/transactions')
app.register_blueprint(accounts_bp, url_prefix='/accounts')
app.register_blueprint(categories_bp, url_prefix='/categories')
app.register_blueprint(dashboard_bp, url_prefix='/dashboard')
app.register_blueprint(auth_bp, url_prefix='/auth')

# Rota base (Health Check)
@app.route('/', methods=['GET'])
def health_check():
    return jsonify({"status": "sucesso", "mensagem": "API modularizada com Blueprints e Migrate!"})

# Contexto da Aplicação (Criação rápida das tabelas)
with app.app_context():
    import models
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)