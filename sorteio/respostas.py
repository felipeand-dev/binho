"""Resposta padrão das ações (POST): JSON para o JavaScript, toast para o resto."""
from django.contrib import messages
from django.http import JsonResponse
from django.shortcuts import redirect
from django.utils.http import url_has_allowed_host_and_scheme


def e_ajax(request):
    """Indica se a requisição veio do JavaScript (fetch com o cabeçalho padrão)."""
    return request.headers.get('x-requested-with') == 'XMLHttpRequest'


def responder(request, destino, mensagem, ok=True, dados=None, **url_kwargs):
    """Responde a uma ação que altera dados.

    Requisições AJAX recebem JSON (status 409 quando uma regra foi violada); as
    demais recebem uma mensagem do Django (toast) e são redirecionadas para `next`
    (se for seguro) ou para `destino`.
    """
    if e_ajax(request):
        corpo = {'ok': ok, 'mensagem': mensagem, **(dados or {})}
        return JsonResponse(corpo, status=200 if ok else 409)
    (messages.success if ok else messages.error)(request, mensagem)
    proximo = request.POST.get('next')
    if proximo and url_has_allowed_host_and_scheme(
        proximo, allowed_hosts={request.get_host()}, require_https=request.is_secure()
    ):
        return redirect(proximo)
    return redirect(destino, **url_kwargs)


def plural(quantidade, singular, plural_):
    """'1 aluno' / '3 alunos' — só formatação de texto."""
    return f'{quantidade} {singular if quantidade == 1 else plural_}'
