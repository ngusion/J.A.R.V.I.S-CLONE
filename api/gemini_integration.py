import os
import google.generativeai as genai
from knowledge_base_manager import log_message

# Carrega a chave da API no início, mas não lança erro aqui.
API_KEY = os.getenv('GEMINI_API_KEY')
CONFIGURABLE_MODEL_NAME = os.getenv('GEMINI_MODEL_NAME', 'gemini-1.5-pro-latest')

_is_configured = False
if API_KEY:
    try:
        genai.configure(api_key=API_KEY)
        _is_configured = True
        print("Integração com Gemini API configurada com sucesso.")
    except Exception as e:
        log_message("ERROR", f"Falha ao configurar a API Gemini com a chave fornecida: {e}")

def _check_api_key():
    """Verifica se a API está configurada antes de fazer uma chamada."""
    if not _is_configured:
        log_message("ERROR", "A API do Gemini não está configurada. Uma chave é necessária.")
        # Esta mensagem será retornada ao usuário se a chave não estiver configurada.
        raise ValueError("A funcionalidade principal de IA não está disponível. A chave da API do Gemini não foi configurada no backend.")

def generate_collaborative_response(prompt: str, conversation_history: list = None):
    """
    Gera uma resposta consultando o LLM (Gemini), usando o histórico da conversa como contexto.
    """
    try:
        _check_api_key()
        model = genai.GenerativeModel(CONFIGURABLE_MODEL_NAME)
        chat = model.start_chat(history=conversation_history or [])
        response = chat.send_message(prompt)
        log_message("INFO", f"Resposta gerada com sucesso pelo modelo {CONFIGURABLE_MODEL_NAME}.")
        return response.text
    except Exception as e:
        log_message("ERROR", f"Erro ao interagir com a API Gemini: {e}")
        return f"Desculpe, ocorreu um erro interno ao processar sua solicitação: {e}"

def analyze_intent(prompt: str):
    """
    Usa o LLM para analisar a intenção do usuário.
    """
    try:
        _check_api_key()
        model = genai.GenerativeModel(CONFIGURABLE_MODEL_NAME)
        structured_prompt = f"""
            Analise o seguinte texto e identifique a intenção do usuário.
            As intenções possíveis são: 'ensinar_regra', 'ensinar_fato', 'conversa_geral'.
            Retorne apenas uma das três opções.

            Texto do usuário: "{prompt}"

            Intenção:
        """
        response = model.generate_content(structured_prompt)
        intent = response.text.strip().lower()
        log_message("INFO", f"Intenção identificada para '{prompt}': {intent}")
        # Validação simples da resposta do modelo
        if intent in ['ensinar_regra', 'ensinar_fato', 'conversa_geral']:
            return intent
        return 'conversa_geral'
    except Exception as e:
        log_message("ERROR", f"Erro na análise de intenção com a API Gemini: {e}")
        return 'conversa_geral'
