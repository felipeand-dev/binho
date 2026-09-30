# App `sorteios`

A tela única do sistema e as regras do sorteio (versão 2, sem banco de dados).

| Arquivo | O que tem |
|---|---|
| `importador.py` | lê o texto colado (SUAP ou um nome por linha) e devolve só os nomes, sem repetidos — RN-01 a RN-03 |
| `servico.py` | `SorteioDaSessao`: estado na sessão (nomes, sorteados, rodada, versão); prévia, iniciar, adicionar, limpar, sortear (`secrets`), desfazer, reiniciar — RN-04 a RN-14 |
| `forms.py` | `ListaForm` (texto colado) |
| `views.py` | views enxutas: chamam o serviço e respondem com JSON (para a animação) ou toast + redirecionamento |
| `urls.py` | `/`, `/previa/`, `/lista/`, `/lista/adicionar/`, `/lista/limpar/`, `/sortear/`, `/desfazer/`, `/reiniciar/` |
| `templates/sorteios/` | `palco.html` (a tela), `_colar_nomes.html` (campo + prévia), `_previa.html` |

O servidor escolhe o sorteado; o JavaScript só anima. Toda ação envia a versão do estado
e é recusada se a tela estiver desatualizada (outra aba).
