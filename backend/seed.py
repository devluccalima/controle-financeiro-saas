from app import app
from database import db
from models import Category, User

def popular_categorias():
    with app.app_context():
        # Pega o primeiro usuário do banco (seu usuário de teste)
        user = User.query.first()
        if not user:
            print("Nenhum usuário encontrado. Crie um usuário primeiro!")
            return

        categorias_padrao = [
            {"nome": "Lazer", "tipo": "despesa", "cor": "#F59E0B"},
            {"nome": "Transporte", "tipo": "despesa", "cor": "#3B82F6"},
            {"nome": "Moradia", "tipo": "despesa", "cor": "#8B5CF6"},
            {"nome": "Saúde", "tipo": "despesa", "cor": "#EC4899"},
            {"nome": "Educação", "tipo": "despesa", "cor": "#06B6D4"},
            {"nome": "Dívidas", "tipo": "despesa", "cor": "#EF4444"},
            {"nome": "Salário", "tipo": "receita", "cor": "#10B981"},
            {"nome": "Investimentos", "tipo": "receita", "cor": "#14B8A6"}
        ]

        for cat in categorias_padrao:
            # Verifica se já não existe para não duplicar
            existe = Category.query.filter_by(user_id=user.id, nome=cat['nome']).first()
            if not existe:
                nova_categoria = Category(
                    user_id=user.id,
                    nome=cat['nome'],
                    tipo=cat['tipo'],
                    cor=cat['cor']
                )
                db.session.add(nova_categoria)
        
        db.session.commit()
        print("✅ Categorias padrão inseridas com sucesso!")

if __name__ == '__main__':
    popular_categorias()