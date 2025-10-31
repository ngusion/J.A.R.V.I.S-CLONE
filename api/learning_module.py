from knowledge_base_manager import add_rule, add_fact, log_message
import re

def learn_new_rule(prompt: str):
    """
    Processa um prompt do usuário para aprender uma nova regra.
    Aprende regras no formato 'Se [condição], então [ação]'.
    """
    # Regex para extrair condição e ação. '(?i)' para case-insensitive, '.' para nova linha
    match = re.search(r"Se\s+(.+),\s+então\s+(.+)", prompt, re.IGNORECASE | re.DOTALL)

    if not match:
        # Tenta uma versão sem vírgula
        match = re.search(r"Se\s+(.+)\s+então\s+(.+)", prompt, re.IGNORECASE | re.DOTALL)

    if match:
        condition = match.group(1).strip()
        action = match.group(2).strip()

        # Adiciona a regra ao banco de dados
        if add_rule(condition, action):
            log_message("INFO", f"Nova regra aprendida com sucesso do prompt: '{prompt}'")
            return f"Entendido. Regra aprendida: 'Se {condition}, então {action}'."
        else:
            log_message("ERROR", f"Falha ao salvar a nova regra do prompt: '{prompt}'")
            return "Desculpe, tive um problema ao tentar aprender essa regra."

    else:
        # Se o formato não corresponder, informa o usuário.
        log_message("WARN", f"Tentativa de ensinar regra com formato inválido: '{prompt}'")
        return "Não consegui entender o formato da regra. Por favor, tente usar 'Se [condição], então [ação]'."

def learn_new_fact(prompt: str):
    """
    Processa um prompt para aprender um novo fato.
    Esta é uma implementação simplificada para demonstração.
    """
    # Em um sistema real, usaríamos NLU para extrair entidades e relações.
    # Ex: "O Brasil é um país da América do Sul." -> (Brasil, é, um país da América do Sul)
    # Por simplicidade, vamos salvar o fato bruto associado a um conceito geral.
    try:
        # A primeira palavra poderia ser o conceito, mas isso é muito simples.
        # Vamos apenas armazenar a declaração completa por enquanto.
        concept = "geral"
        fact = prompt
        relationship = "declaração do usuário"
        add_fact(fact, concept, relationship, source="user_teaching")
        log_message("INFO", f"Novo fato aprendido: '{prompt}'")
        return f"Obrigado por me ensinar. Armazenei a seguinte informação: '{prompt}'."
    except Exception as e:
        log_message("ERROR", f"Falha ao aprender novo fato: {e}")
        return "Desculpe, tive um problema ao armazenar essa informação."
