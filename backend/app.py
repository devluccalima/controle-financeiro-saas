import os
from flask import Flask, jsonify
from database import db

# Importa as rotas modularizadas
from routes.users import users_bp

app = Flask(__name__)

# Configurações
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'postgresql://root:rootpassword@db:5432/finance_saas')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Inicializa o banco de dados com o app
db.init_app(app)

# Registra os Blueprints
# Tudo que vier de users_bp terá automaticamente o prefixo /users
app.register_blueprint(users_bp, url_prefix='/users')

# Rota base (Health Check) mantida aqui para os testes de CI/CD
@app.route('/', methods=['GET'])
def health_check():
    return jsonify({"status": "sucesso", "mensagem": "API modularizada com Blueprints!"})

if __name__ == '__main__':
    with app.app_context():
        # Importa os modelos aqui dentro para garantir a criação das tabelas
        import models
        db.create_all()
    app.run(debug=True, host='0.0.0.0')