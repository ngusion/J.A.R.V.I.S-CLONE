from knowledge_base_manager import get_all_rules
import re

def process_rules(prompt: str):
    """
    Processa o prompt do usuário contra o conjunto de regras.
    Retorna a ação da primeira regra correspondente ou None.
    """
    rules = get_all_rules()

    for rule in rules:
        # Usando expressões regulares para uma correspondência mais flexível
        # A condição da regra é tratada como um padrão regex.
        # '(?i)' faz a correspondência ser case-insensitive.
        condition_pattern = f"(?i){rule['rule_condition']}"

        if re.search(condition_pattern, prompt):
            # A regra correspondeu, retorna a ação correspondente
            return rule['rule_action']

    # Nenhuma regra correspondeu
    return None
