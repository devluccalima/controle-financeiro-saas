def test_dashboard_sem_parametros(client):
    """Testa se o dashboard bloqueia buscas sem informar o usuário, mês e ano"""
    
    response = client.get('/dashboard/resumo')
    
    # O sistema deve retornar o erro 400 (Bad Request)
    assert response.status_code == 400
    
    # Pega o JSON retornado e verifica a mensagem dentro da chave "erro"
    dados = response.get_json()
    assert "obrigatórios" in dados["erro"]