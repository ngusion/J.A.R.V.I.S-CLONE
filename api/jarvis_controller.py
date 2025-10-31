from rule_engine import process_rules
from learning_module import learn_new_rule, learn_new_fact
from gemini_integration import generate_collaborative_response, analyze_intent
from knowledge_base_manager import (
    add_message_to_history,
    get_conversation_history,
    log_message
)
import uuid

# Mapeamento de intenções para ações
intent_actions = {
    'ensinar_regra': 'learning_rule',
    'ensinar_fato': 'learning_fact',
    'conversa_geral': 'general_conversation',
}

# Gerenciamento de estado de conversação para aprendizado interativo
# TODO: Mover o estado da conversa para o banco de dados para persistência.
conversation_states = {}

def process_chat_message(prompt: str, conversation_id: str = None):
    """
    Processa a mensagem de chat do usuário, orquestrando as diferentes
    partes do JARVIS.
    """
    if not conversation_id:
        conversation_id = str(uuid.uuid4())

    # 1. Adiciona a mensagem do usuário ao histórico
    add_message_to_history(conversation_id, 'user', [{"text": prompt}])

    # 2. Verifica o estado atual da conversa
    current_state = conversation_states.get(conversation_id)

    if current_state == 'awaiting_rule_definition':
        # Usuário está definindo uma regra
        response_text = learn_new_rule(prompt)
        conversation_states.pop(conversation_id, None) # Limpa o estado
    else:
        # 3. Análise de Intenção
        intent = analyze_intent(prompt)
        action = intent_actions.get(intent, 'general_conversation')

        if action == 'learning_rule' or "quero te ensinar uma regra" in prompt.lower():
            response_text = "Ótimo! Por favor, me diga a regra. Tente usar um formato como 'Se [condição], então [ação ou conclusão]'."
            conversation_states[conversation_id] = 'awaiting_rule_definition'
        elif action == 'learning_fact':
            response_text = learn_new_fact(prompt)
        else: # Conversa geral
            # 4. Processamento de Regras
            rule_response = process_rules(prompt)
            if rule_response:
                response_text = rule_response
                log_message("INFO", f"Regra acionada para o prompt: '{prompt}'. Resposta: '{response_text}'")
            else:
                # 5. Se nenhuma regra for acionada, consulta o LLM
                history = get_conversation_history(conversation_id)
                response_text = generate_collaborative_response(prompt, history)
                log_message("INFO", f"Nenhuma regra acionada. Consultando o LLM para o prompt: '{prompt}'")

    # 6. Adiciona a resposta do modelo ao histórico
    add_message_to_history(conversation_id, 'model', [{"text": response_text}])

    return {"text": response_text, "conversation_id": conversation_id}
