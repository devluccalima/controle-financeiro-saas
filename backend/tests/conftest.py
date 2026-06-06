import pytest
from app import app

@pytest.fixture
def client():
    # Configura o Flask para modo de teste
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client