"""Configurações do Sorteio de Alunos (Django sem banco de dados).

O estado do sorteio vive na sessão, guardada em cookie assinado no navegador do professor
(constituição 2.0.0, Princípio II). Em produção (Vercel), tudo o que é sensível vem de
variáveis de ambiente.
"""
import os
from pathlib import Path

from django.contrib.messages import constants as messages
from django.core.exceptions import ImproperlyConfigured

BASE_DIR = Path(__file__).resolve().parent.parent


def _lista_do_ambiente(nome, padrao):
    return [item.strip() for item in os.environ.get(nome, padrao).split(',') if item.strip()]


# Na Vercel (variável VERCEL definida pela plataforma) o padrão é produção.
DEBUG = os.environ.get('DJANGO_DEBUG', '0' if os.environ.get('VERCEL') else '1') == '1'

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', '')
if not SECRET_KEY:
    if not DEBUG:
        # A chave assina o cookie da sessão: sem ela, o estado poderia ser forjado.
        raise ImproperlyConfigured('Defina a variável de ambiente DJANGO_SECRET_KEY.')
    SECRET_KEY = 'sorteio-dev-chave-somente-local'

ALLOWED_HOSTS = _lista_do_ambiente(
    'DJANGO_ALLOWED_HOSTS', '127.0.0.1,localhost,testserver,.vercel.app'
)
CSRF_TRUSTED_ORIGINS = _lista_do_ambiente('DJANGO_CSRF_TRUSTED_ORIGINS', 'https://*.vercel.app')

INSTALLED_APPS = [
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'sorteio',
    'sorteio.sorteios',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# Sem banco de dados: nada do sorteio é gravado no servidor.
DATABASES = {}

# Sessão em cookie assinado, apagada quando o navegador fecha.
SESSION_ENGINE = 'django.contrib.sessions.backends.signed_cookies'
SESSION_EXPIRE_AT_BROWSER_CLOSE = True
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'
MESSAGE_STORAGE = 'django.contrib.messages.storage.cookie.CookieStorage'

LANGUAGE_CODE = 'pt-br'
TIME_ZONE = 'America/Sao_Paulo'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
# Serve direto de sorteio/static/ (sem collectstatic no deploy da Vercel).
WHITENOISE_USE_FINDERS = True

if not DEBUG:
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SECURE_SSL_REDIRECT = os.environ.get('DJANGO_SSL_REDIRECT', '1') == '1'
    SECURE_HSTS_SECONDS = int(os.environ.get('DJANGO_HSTS_SECONDS', '2592000'))
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_REFERRER_POLICY = 'same-origin'

# HSTS de subdomínios e preload só fazem sentido com domínio próprio; o *.vercel.app já
# está na lista de preload dos navegadores.
SILENCED_SYSTEM_CHECKS = ['security.W005', 'security.W021']

# Classes usadas pelos toasts (ver sorteio/templates/partials/_toasts.html).
MESSAGE_TAGS = {
    messages.DEBUG: 'info',
    messages.INFO: 'info',
    messages.SUCCESS: 'sucesso',
    messages.WARNING: 'aviso',
    messages.ERROR: 'erro',
}
