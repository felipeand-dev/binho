from django.urls import path

from . import views

app_name = 'sorteios'

urlpatterns = [
    path('', views.palco, name='palco'),
    path('previa/', views.previa, name='previa'),
    path('lista/', views.iniciar, name='iniciar'),
    path('lista/adicionar/', views.adicionar, name='adicionar'),
    path('lista/limpar/', views.limpar, name='limpar'),
    path('sortear/', views.sortear, name='sortear'),
    path('desfazer/', views.desfazer, name='desfazer'),
    path('reiniciar/', views.reiniciar, name='reiniciar'),
]
