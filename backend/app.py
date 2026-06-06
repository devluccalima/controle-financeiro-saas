from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/', methods=['GET'])
def health_check():
    return jsonify({
        "status": "sucesso", 
        "mensagem": "A API do SaaS Financeiro está online e pronta para substituir as planilhas!"
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')