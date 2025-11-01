import sqlite3
# Importa o DB_PATH do novo arquivo de configuração centralizado.
from config import DB_PATH

def create_schema():
    # Conecta ao banco de dados usando o caminho centralizado
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # Tabela da Base de Conhecimento (KB)
    c.execute('''
        CREATE TABLE IF NOT EXISTS knowledge_base (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fact TEXT NOT NULL,
            concept TEXT NOT NULL,
            relationship TEXT NOT NULL,
            metadata TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            source TEXT,
            confidence REAL,
            modification_history TEXT
        )
    ''')

    # Tabela do Conjunto de Regras
    c.execute('''
        CREATE TABLE IF NOT EXISTS rule_set (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            rule_condition TEXT NOT NULL,
            rule_action TEXT NOT NULL,
            priority INTEGER DEFAULT 0,
            is_active BOOLEAN DEFAULT 1
        )
    ''')

    # Tabela do Histórico de Conversas
    c.execute('''
        CREATE TABLE IF NOT EXISTS conversation_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            conversation_id TEXT NOT NULL,
            role TEXT NOT NULL,
            parts TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Tabela de Logs de Erros e Aprendizagem
    c.execute('''
        CREATE TABLE IF NOT EXISTS logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            log_type TEXT NOT NULL,
            message TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    conn.commit()
    conn.close()
    print(f"Schema do banco de dados em '{DB_PATH}' verificado e/ou criado com sucesso.")

if __name__ == '__main__':
    create_schema()
