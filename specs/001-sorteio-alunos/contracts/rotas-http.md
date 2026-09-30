# Contrato: rotas HTTP

Interface que o sistema expõe ao navegador. Convenções:

- Toda rota que altera dados aceita **somente POST** com token CSRF (constituição,
  Princípio II). GET nessas rotas → `405 Method Not Allowed`.
- Turma, aluno ou sorteio inexistente → `404`.
- **Ações com dupla resposta** (marcadas "AJAX"): se a requisição tiver o cabeçalho
  `X-Requested-With: XMLHttpRequest`, a resposta é JSON; senão, a resposta é um
  redirecionamento (302) com uma mensagem do Django exibida como toast.
- JSON de erro de regra de negócio: status `409` e
  `{"ok": false, "mensagem": "<texto em Português>"}`.
- O JavaScript envia o CSRF no cabeçalho `X-CSRFToken` (lido do cookie `csrftoken`).

## Turmas (app `turmas`, namespace `turmas`)

| Método | URL | Nome | Resposta |
|---|---|---|---|
| GET | `/` | `turmas:index` | `index.html`: cards das turmas com `total_alunos` e `total_sorteados`; estado vazio com os 3 passos |
| GET | `/turmas/nova/` | `turmas:nova` | formulário: nome, descrição, texto a colar |
| POST | `/turmas/nova/` | `turmas:nova` | `acao=previa` → mesma página com a prévia (nada é salvo). `acao=confirmar` → cria a turma e importa os alunos em uma transação; 302 para `sorteios:palco`. Nome inválido/repetido → página com erro no campo |
| POST | `/turmas/previa/` | `turmas:previa_nova` | JSON da prévia (abaixo) para uma turma ainda não criada (tudo conta como novo, exceto repetidos dentro do texto) |
| GET | `/turmas/<turma_id>/importar/` | `turmas:importar` | formulário "Colar mais uma lista" |
| POST | `/turmas/<turma_id>/importar/` | `turmas:importar` | `acao=previa` → página com prévia; `acao=confirmar` → importa os novos; 302 para `alunos:lista` com toast "N alunos importados, M já estavam na turma." |
| POST | `/turmas/<turma_id>/previa/` | `turmas:previa` | JSON da prévia comparando com os alunos da turma |
| POST | `/turmas/<turma_id>/renomear/` | `turmas:renomear` | campo `nome`; AJAX. Sucesso: toast "Turma renomeada." Nome inválido/repetido: 409 / toast de erro |
| POST | `/turmas/<turma_id>/excluir/` | `turmas:excluir` | exige confirmação no modal; 302 para `turmas:index` com toast "Turma excluída." |

### JSON da prévia

```json
{
  "ok": true,
  "formato": "suap",
  "encontrados": 32,
  "novos": 30,
  "duplicados": 2,
  "alunos": [
    {"nome": "ADRIANO MOREIRA DA COSTA", "matricula": "20261FICTEX0027", "duplicado": false}
  ]
}
```

- `formato`: `"suap"` ou `"lista"` (lista simples).
- Texto vazio → `encontrados: 0` e `"alunos": []` (a interface mostra "Nenhum aluno
  encontrado").
- Texto acima de 100.000 caracteres → 400 `{"ok": false, "mensagem": "O texto colado é
  grande demais."}`.

## Alunos (app `alunos`, namespace `alunos`)

| Método | URL | Nome | Resposta |
|---|---|---|---|
| GET | `/alunos/turma/<turma_id>/` | `alunos:lista` | aba **Alunos**: busca, badges disponível/já sorteado, adicionar, colar mais uma lista, remover, zona de perigo "Limpar lista" |
| POST | `/alunos/turma/<turma_id>/adicionar/` | `alunos:adicionar` | campos `nome` (obrigatório), `matricula` (opcional); Sucesso: 302 para `alunos:lista` com toast "Aluno adicionado."; duplicado ou nome vazio: 302 com toast de erro "Esse aluno já está na turma." |
| POST | `/alunos/<aluno_id>/remover/` | `alunos:remover` | exige confirmação; 302 para `alunos:lista` com toast "Aluno removido." |
| POST | `/alunos/turma/<turma_id>/limpar/` | `alunos:limpar` | exige confirmação; 302 para `alunos:lista` com toast "Lista limpa. A turma continua cadastrada." |

## Sorteios (app `sorteios`, namespace `sorteios`)

| Método | URL | Nome | Resposta |
|---|---|---|---|
| GET | `/sorteio/<turma_id>/` | `sorteios:palco` | aba **Sorteio**: palco, listas Disponíveis / Já sorteados com contadores, botões Sortear, Reiniciar, Desfazer, Modo apresentação |
| POST | `/sorteio/<turma_id>/sortear/` | `sorteios:sortear` | AJAX (JSON abaixo). Sem JS: 302 para `sorteios:palco` com toast "3º sorteado: NOME" |
| POST | `/sorteio/<turma_id>/desfazer/` | `sorteios:desfazer` | AJAX. JSON `{"ok": true, "mensagem": "Desfeito: NOME", "id": 12, "disponiveis": 30, "sorteados": 2}` (`id` = aluno devolvido, ou `null` se ele já foi removido) |
| POST | `/sorteio/<turma_id>/reiniciar/` | `sorteios:reiniciar` | exige confirmação; 302 para `sorteios:palco` com toast "Sorteio reiniciado. Rodada N." |
| GET | `/sorteio/<turma_id>/historico/` | `sorteios:historico` | aba **Histórico**: linha do tempo agrupada por rodada, com ordem e horário |

### JSON do sortear

Sucesso (`200`):

```json
{
  "ok": true,
  "id": 17,
  "nome": "KAUÃ BARBOSA",
  "ordem": 3,
  "rodada": 1,
  "disponiveis": 29,
  "sorteados": 3
}
```

- `id` é o `pk` do **aluno** (a interface localiza o item na lista "Disponíveis" por
  `data-aluno-id` para o voo com Flip).
- A animação DEVE parar exatamente em `nome`; o JavaScript não escolhe nem altera o
  resultado (RN-14).

Regra violada (`409`):

```json
{"ok": false, "mensagem": "Todos os alunos já foram sorteados. Reinicie o sorteio.", "disponiveis": 0, "sorteados": 32}
```

ou, turma vazia: `"mensagem": "A turma não tem alunos. Importe a lista para começar."`.

## Atributos de dados usados pelo JavaScript (contrato template ↔ JS)

| Atributo | Onde | Uso |
|---|---|---|
| `data-url-sortear`, `data-url-desfazer` | contêiner do palco (`#palco`) | URLs das ações (os formulários POST dos botões usam as mesmas URLs no `action`, para funcionar sem JS) |
| `data-aluno-id`, `data-nome` | cada item de "Disponíveis" / "Já sorteados" | fita da roleta e voo com Flip |
| `data-contador="disponiveis"` / `"sorteados"` | números dos contadores | animação dos números |
| `data-confirmar="<mensagem>"` | formulários de ações destrutivas | abre o modal de confirmação antes do envio |
| `data-url-previa` | formulário de importação | prévia ao vivo |
| `aria-live="polite"` | região de anúncio do palco | "Sorteado: NOME" |

## Admin

`/admin/`: `Turma`, `Aluno` e `Sorteio` registrados (listagem, busca por nome/matrícula,
filtro por turma e rodada). Exige superusuário (`createsuperuser`).
