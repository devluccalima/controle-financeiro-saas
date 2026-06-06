from models import User, Transaction, Account, Category
from database import db
from werkzeug.security import generate_password_hash
from datetime import datetime

def test_delete_transaction_with_token(client, app):
    """Testa se a rota DELETE funciona apenas com um token JWT válido"""
    
    with app.app_context():
        # 0. PREVENÇÃO: Limpa qualquer sujeira de testes anteriores que possam ter travado
        User.query.filter_by(email="tester@email.com").delete()
        db.session.commit()

        # 1. CRIANDO DADOS FALSOS
        user = User(
            nome="Tester", 
            email="tester@email.com", 
            password_hash=generate_password_hash("12345")
        )
        db.session.add(user)
        db.session.commit()
        db.session.refresh(user)

        conta = Account(user_id=user.id, nome="Conta Teste", tipo="credito")
        categoria = Category(user_id=user.id, nome="Categoria Teste", tipo="despesa")
        db.session.add_all([conta, categoria])
        db.session.commit()
        db.session.refresh(conta)
        db.session.refresh(categoria)

        transacao = Transaction(
            user_id=user.id,
            account_id=conta.id,
            category_id=categoria.id,
            descricao="Compra Falsa",
            valor=100.0,
            data_vencimento=datetime.now()
        )
        db.session.add(transacao)
        db.session.commit()
        db.session.refresh(transacao)
        
        transacao_id = str(transacao.id)

    # O bloco TRY...FINALLY garante que o sistema não vai deixar sujeira no banco
    try:
        # 2. O TESTE DO HACKER (Sem Token)
        response_fail = client.delete(f'/transactions/{transacao_id}')
        assert response_fail.status_code == 401 # Unauthorized

        # 3. O TESTE DO DONO DO SISTEMA (Com Token)
        response_login = client.post('/auth/login', json={
            "email": "tester@email.com",
            "senha": "12345"
        })
        token = response_login.get_json()["token"]

        response_success = client.delete(f'/transactions/{transacao_id}', headers={
            "Authorization": f"Bearer {token}"
        })
        assert response_success.status_code == 200 # Sucesso
        
        dados = response_success.get_json()
        assert "excluída" in dados["mensagem"]

    finally:
        # 4. LIMPANDO A SUJEIRA (Esta parte vai rodar SEMPRE, aconteça o que acontecer)
        with app.app_context():
            Transaction.query.delete()
            Account.query.delete()
            Category.query.delete()
            User.query.filter_by(email="tester@email.com").delete()
            db.session.commit()