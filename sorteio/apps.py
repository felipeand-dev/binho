from django.apps import AppConfig


class SorteioConfig(AppConfig):
    """App-pacote com os templates, estáticos e utilitários globais."""

    default_auto_field = 'django.db.models.BigAutoField'
    name = 'sorteio'
    verbose_name = 'Sorteio de Alunos'
