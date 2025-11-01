import sqlite3
import json
from datetime import datetime
# Importa o DB_PATH do novo arquivo de configuração centralizado.
from config import DB_PATH

def get_db_connection():
    """Cria e retorna uma conexão com o banco de dados."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def log_message(log_type: str, message: str):
    """Registra uma mensagem de log no banco de dados."""
    try:
        conn = get_db_connection()
        conn.execute('INSERT INTO logs (log_type, message) VALUES (?, ?)', (log_type, message))
        conn.commit()
        conn.close()
    except sqlite3.Error as e:
        # Evita um loop de logs se o próprio log falhar
        print(f"Erro ao registrar log no banco de dados: {e}", file=sys.stderr)

# ... (o resto do arquivo permanece o mesmo)
# Funções para a Base de Conhecimento (KB)
def add_fact(fact: str, concept: str, relationship: str, source: str = "user", confidence: float = 1.0, metadata: dict = None):
    """Adiciona um novo fato à base de conhecimento."""
    conn = get_db_connection()
    modification_history = json.dumps([{"timestamp": str(datetime.now()), "change": "Created"}])
    metadata_str = json.dumps(metadata) if metadata else "{}"
    conn.execute('''
        INSERT INTO knowledge_base (fact, concept, relationship, source, confidence, metadata, modification_history)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (fact, concept, relationship, source, confidence, metadata_str, modification_history))
    conn.commit()
    conn.close()
    log_message("INFO", f"Novo fato adicionado: {fact}")

def get_fact_by_concept(concept: str):
    """Busca fatos na KB por um conceito específico."""
    conn = get_db_connection()
    cursor = conn.execute('SELECT * FROM knowledge_base WHERE concept = ?', (concept,))
    facts = cursor.fetchall()
    conn.close()
    return [dict(row) for row in facts] if facts else None

# Funções para o Conjunto de Regras
def add_rule(condition: str, action: str, priority: int = 0):
    """Adiciona uma nova regra ao conjunto de regras."""
    conn = get_db_connection()
    conn.execute('''
        INSERT INTO rule_set (rule_condition, rule_action, priority)
        VALUES (?, ?, ?)
    ''', (condition, action, priority))
    conn.commit()
    conn.close()
    log_message("INFO", f"Nova regra adicionada: IF {condition} THEN {action}")
    return True

def get_all_rules():
    """Retorna todas as regras ativas do banco de dados."""
    conn = get_db_connection()
    cursor = conn.execute('SELECT * FROM rule_set WHERE is_active = 1 ORDER BY priority DESC')
    rules = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rules]

# Funções para o Histórico de Conversas
def add_message_to_history(conversation_id: str, role: str, parts: list):
    """Adiciona uma mensagem ao histórico de conversas."""
    conn = get_db_connection()
    parts_str = json.dumps(parts)
    conn.execute('''
        INSERT INTO conversation_history (conversation_id, role, parts)
        VALUES (?, ?, ?)
    ''', (conversation_id, role, parts_str))
    conn.commit()
    conn.close()

def get_conversation_history(conversation_id: str, limit: int = 20):
    """Obtém o histórico de uma conversa específica."""
    conn = get_db_connection()
    cursor = conn.execute('''
        SELECT role, parts FROM conversation_history
        WHERE conversation_id = ? ORDER BY timestamp DESC LIMIT ?
    ''', (conversation_id, limit))
    history_rows = cursor.fetchall()
    conn.close()

    # Monta o histórico no formato esperado (lista de dicionários)
    history = []
    for row in reversed(history_rows): # Invertido para manter a ordem cronológica
        history.append({
            "role": row["role"],
            "parts": json.loads(row["parts"])
        })
    return history
