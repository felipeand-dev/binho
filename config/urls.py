"""Rotas: o site inteiro é a tela de sorteio."""
from django.urls import include, path

urlpatterns = [
    path('', include('sorteio.sorteios.urls')),
]
