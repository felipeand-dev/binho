"""Views da tela única de sorteio. As regras ficam em `servico.py` (constituição I)."""
from django.contrib import messages
from django.http import JsonResponse
from django.shortcuts import redirect, render
from django.views.decorators.http import require_POST

from sorteio.regras import RegraNegocioError
from sorteio.respostas import plural, responder

from .forms import TAMANHO_MAXIMO_TEXTO, ListaForm
from .servico import SorteioDaSessao

DESTINO = 'sorteios:palco'


def _contexto(sorteio, form=None):
    disponiveis = sorteio.disponiveis
    sorteados = sorteio.sorteados
    return {
        'sorteio': sorteio,
        'disponiveis': disponiveis,
        'sorteados': sorteados,
        'total_disponiveis': len(disponiveis),
        'total_sorteados': len(sorteados),
        'ultimo': sorteio.ultimo,
        'form': form or ListaForm(),
    }


def palco(request):
    """A tela: sem lista, o campo para colar nomes; com lista, o palco (FR-001, FR-014)."""
    sorteio = SorteioDaSessao(request.session)
    return render(request, 'sorteios/palco.html', _contexto(sorteio))


@require_POST
def previa(request):
    """JSON da prévia ao vivo; não altera nada (FR-004)."""
    texto = request.POST.get('texto', '')
    if len(texto) > TAMANHO_MAXIMO_TEXTO:
        return JsonResponse(
            {'ok': False, 'mensagem': 'O texto colado é grande demais.'}, status=400
        )
    return JsonResponse(SorteioDaSessao(request.session).previa(texto).como_json())


@require_POST
def iniciar(request):
    """Usa a lista colada (FR-002..FR-007). Em erro, mantém o texto na tela."""
    sorteio = SorteioDaSessao(request.session)
    form = ListaForm(request.POST)
    try:
        if not form.is_valid():
            raise RegraNegocioError(next(iter(form.errors.values()))[0])
        total = sorteio.iniciar(form.cleaned_data['texto'])
    except RegraNegocioError as erro:
        messages.error(request, str(erro))
        return render(request, 'sorteios/palco.html', _contexto(sorteio, form), status=200)
    messages.success(request, f'Lista pronta com {plural(total, "nome", "nomes")}.')
    return redirect(DESTINO)


@require_POST
def adicionar(request):
    """Acrescenta nomes com a lista em uso (FR-008)."""
    sorteio = SorteioDaSessao(request.session)
    form = ListaForm(request.POST)
    try:
        if not form.is_valid():
            raise RegraNegocioError(next(iter(form.errors.values()))[0])
        texto = form.cleaned_data['texto']
        novos, repetidos = sorteio.adicionar(texto, request.POST.get('versao'))
    except RegraNegocioError as erro:
        return responder(request, DESTINO, str(erro), ok=False)
    verbo = 'estava' if repetidos == 1 else 'estavam'
    mensagem = (
        f'{plural(novos, "nome adicionado", "nomes adicionados")}, '
        f'{repetidos} já {verbo} na lista.'
    )
    return responder(request, DESTINO, mensagem)


@require_POST
def limpar(request):
    """Apaga a lista para começar outra (FR-009); confirmação no modal."""
    try:
        SorteioDaSessao(request.session).limpar(request.POST.get('versao'))
    except RegraNegocioError as erro:
        return responder(request, DESTINO, str(erro), ok=False)
    return responder(request, DESTINO, 'Lista apagada. Cole uma nova lista para sortear.')


@require_POST
def sortear(request):
    """O servidor sorteia; o navegador só anima até o nome recebido (FR-010..FR-012)."""
    sorteio = SorteioDaSessao(request.session)
    try:
        resultado = sorteio.sortear(request.POST.get('versao'))
    except RegraNegocioError as erro:
        return responder(request, DESTINO, str(erro), ok=False, dados=sorteio.contadores())
    return responder(
        request, DESTINO, f'{resultado.ordem}º sorteado: {resultado.nome}',
        dados={
            'id': resultado.id,
            'nome': resultado.nome,
            'ordem': resultado.ordem,
            'rodada': resultado.rodada,
            **sorteio.contadores(),
        },
    )


@require_POST
def desfazer(request):
    """Devolve o último sorteado (FR-017)."""
    sorteio = SorteioDaSessao(request.session)
    try:
        resultado = sorteio.desfazer(request.POST.get('versao'))
    except RegraNegocioError as erro:
        return responder(request, DESTINO, str(erro), ok=False, dados=sorteio.contadores())
    return responder(
        request, DESTINO, f'Desfeito: {resultado.nome} voltou para os disponíveis.',
        dados={'id': resultado.id, 'nome': resultado.nome, **sorteio.contadores()},
    )


@require_POST
def reiniciar(request):
    """Nova rodada com todos disponíveis (FR-016); confirmação no modal."""
    try:
        rodada = SorteioDaSessao(request.session).reiniciar(request.POST.get('versao'))
    except RegraNegocioError as erro:
        return responder(request, DESTINO, str(erro), ok=False)
    return responder(request, DESTINO, f'Sorteio reiniciado. Rodada {rodada}.')
