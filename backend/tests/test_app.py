import pytest
from app import app

@pytest.fixture
def client():
    # Configura o Flask para modo de teste
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_health_check(client):
    """Testa se a API está online e retornando status 200"""
    response = client.get('/')
    
    assert response.status_code == 200
    assert b"sucesso" in response.data
    
    # O teste só passa se o status for 200 (OK)
    assert response.status_code == 200
    
    # O teste só passa se a palavra "sucesso" estiver no JSON retornado
    assert b"sucesso" in response.data