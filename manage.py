#!/usr/bin/env python
"""Utilitário de linha de comando do Django para o projeto Sorteio de Alunos."""
import os
import sys

if __name__ == '__main__':
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            'Não foi possível importar o Django. Ative o ambiente com '
            '"source .venv/bin/activate" ou use ".venv/bin/python".'
        ) from exc
    execute_from_command_line(sys.argv)
