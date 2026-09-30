# Contrato: rotas HTTP

Convenções:

- Tudo que altera o estado é **POST com CSRF** (`@require_POST`); GET nessas rotas → 405.
- Toda ação que altera o estado envia o campo `versao` (a versão que a tela conhece).
  Versão diferente da sessão → recusa: 409 em AJAX, ou toast de erro + redirecionamento.
- Ações com dupla resposta (marcadas **AJAX**): com o cabeçalho
  `X-Requested-With: XMLHttpRequest` devolvem JSON; sem ele, toast do Django e 302 para `/`.
- Erro de regra (JSON): status 409, `{"ok": false, "mensagem": "...", "versao": N, ...}`.
- Toda resposta de sucesso que altera o estado devolve a nova `versao`.

| Método | URL | Nome | Resposta |
|---|---|---|---|
| GET | `/` | `sorteios:palco` | Sem lista: campo de colar nomes com prévia. Com lista: palco, Disponíveis, Já sorteados, botões |
| POST | `/previa/` | `sorteios:previa` | JSON da prévia (não altera nada; sem `versao`) |
| POST | `/lista/` | `sorteios:iniciar` | campo `texto`; cria a lista; 302 para `/` com toast "Lista pronta com N nomes." ou erro |
| POST | `/lista/adicionar/` | `sorteios:adicionar` | campos `texto`, `versao`; 302 com toast "N nomes adicionados, M já estavam na lista." |
| POST | `/lista/limpar/` | `sorteios:limpar` | campo `versao`; confirmação no modal; 302 com toast "Lista apagada." |
| POST | `/sortear/` | `sorteios:sortear` | **AJAX**, campo `versao` (JSON abaixo); sem JS: toast "Nº sorteado: NOME" |
| POST | `/desfazer/` | `sorteios:desfazer` | **AJAX**, campo `versao`; JSON `{"ok": true, "mensagem": "Desfeito: NOME voltou para os disponíveis.", "id", "nome", "disponiveis", "sorteados", "versao"}` |
| POST | `/reiniciar/` | `sorteios:reiniciar` | campo `versao`; confirmação no modal; 302 com toast "Sorteio reiniciado. Rodada N." |

## JSON da prévia (`/previa/`)

```json
{"ok": true, "formato": "suap", "encontrados": 32, "novos": 32, "ja_na_lista": 0,
 "nomes": [{"nome": "ADRIANO MOREIRA DA COSTA", "ja_na_lista": false}]}
```

Sem lista em uso, `ja_na_lista` é sempre 0/false. Texto acima de 100.000 caracteres → 400.

## JSON do sortear (`/sortear/`)

```json
{"ok": true, "id": 17, "nome": "KAUÃ BARBOSA LIMA", "ordem": 3, "rodada": 1,
 "disponiveis": 29, "sorteados": 3, "versao": 8}
```

`id` = posição do nome na lista (`data-aluno-id` na tela). Recusas (409): todos sorteados,
sem lista, versão antiga.

## Atributos usados pelo JavaScript

| Atributo | Onde | Uso |
|---|---|---|
| `data-url-sortear`, `data-url-desfazer` | `#palco` | URLs das ações |
| `data-versao` | `#palco` | versão atual; o JS envia em cada POST e atualiza com a resposta |
| `input[name=versao]` | formulários | mesma versão, para funcionar sem JS |
| `data-aluno-id`, `data-nome` | itens das listas | fita da roleta e voo com Flip |
| `data-contador` | contadores | animação dos números |
| `data-confirmar` | Reiniciar, Limpar lista | modal de confirmação |
| `data-url-previa` | textarea dos nomes | prévia ao vivo |
