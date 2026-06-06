def test_dashboard_sem_parametros(client):
    """Testa se o dashboard bloqueia buscas sem informar o usuário, mês e ano"""
    
    # Tenta acessar a rota de resumo sem passar os parâmetros obrigatórios
    response = client.get('/dashboard/resumo')
    
    # O sistema deve retornar o erro 400 (Bad Request)
    assert response.status_code == 400
    
    # A mensagem de erro deve estar no retorno
    assert b"obrigatorios na URL" in response.data