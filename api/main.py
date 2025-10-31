# Primeiro, inicialize o banco de dados para garantir que as tabelas existam.
import sys
import os
from database_schema import create_schema

# --- Inicialização Crítica ---
# Garante que o schema do banco de dados seja criado antes que qualquer
# outro módulo que dependa do banco de dados seja importado.
try:
    print("Inicializando o backend do JARVIS...")
    print("Verificando e criando o schema do banco de dados...")
    create_schema()
    print("Schema do banco de dados 'jarvis.db' garantido.")
except Exception as e:
    print(f"\033[91mERRO CRÍTICO: Falha ao criar o schema do banco de dados: {e}\033[0m")
    sys.exit(1)
# --- Fim da Inicialização Crítica ---


from flask import Flask, request, jsonify
from flask_cors import CORS
from jarvis_controller import process_chat_message
from knowledge_base_manager import log_message

app = Flask(__name__)

# Configuração do CORS
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

@app.route('/api/chat', methods=['POST'])
def chat():
    """Endpoint principal para interação com o JARVIS."""
    try:
        data = request.json
        if not data or 'prompt' not in data:
            log_message("WARN", "Recebida requisição para /api/chat sem o campo 'prompt'.")
            return jsonify({"error": "O campo 'prompt' é obrigatório."}), 400

        prompt = data.get('prompt')
        conversation_id = data.get('conversation_id')

        # Log anônimo da requisição recebida
        log_message("INFO", f"Nova requisição recebida em /api/chat para a conversa: {conversation_id or 'nova'}")

        response = process_chat_message(prompt, conversation_id)

        return jsonify(response)

    except Exception as e:
        # Usar o logger do KBM para registrar o erro no banco de dados
        log_message("CRITICAL", f"Erro fatal no endpoint /api/chat: {e}")
        # Também logar no console para debug
        print(f"Erro em /api/chat: {e}", file=sys.stderr)
        return jsonify({"error": "Ocorreu um erro interno no servidor."}), 500

@app.route('/api/teach_rule', methods=['POST'])
def teach_rule():
    return jsonify({"message": "Endpoint em desenvolvimento."}), 501

@app.route('/api/explain', methods=['GET'])
def explain():
    # TODO: Implementar a lógica para rastrear e explicar o raciocínio.
    return jsonify({"message": "Endpoint em desenvolvimento."}), 501

def final_initialization_check():
    """Verificações finais antes de iniciar o servidor."""
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        warning_message = "\033[93mAVISO: A variável de ambiente GEMINI_API_KEY não está definida.\033[0m"
        print(warning_message)
        log_message("WARN", "Servidor iniciado sem a chave da API do Gemini. A IA generativa não funcionará.")
    else:
        print("Chave da API do Gemini encontrada.")
        # A configuração real da API acontece no módulo gemini_integration

    print("\033[92mInicialização do JARVIS concluída. Servidor pronto para receber requisições.\033[0m")

if __name__ == '__main__':
    final_initialization_check()
    app.run(host='0.0.0.0', port=5000, debug=True)
