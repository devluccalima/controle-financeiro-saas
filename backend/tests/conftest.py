import pytest
from app import app as flask_app

@pytest.fixture
def app():
    # Expõe a aplicação para que os testes possam usar o app_context()
    yield flask_app

@pytest.fixture
def client(app): # O client agora recebe o app que acabamos de criar
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client