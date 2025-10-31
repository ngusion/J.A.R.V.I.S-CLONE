# config.py
import os

# Define o caminho do banco de dados. Em um ambiente serverless como o Vercel,
# o único diretório gravável é /tmp. Para desenvolvimento local,
# pode ser útil usar um caminho local, mas /tmp funciona em ambos.
DB_PATH = os.path.join('/tmp', 'jarvis.db')
