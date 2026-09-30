# Plano de Implementação: Sorteio de Alunos por Turma

**Branch**: `001-sorteio-alunos` | **Data**: 2026-09-30 | **Spec**: [spec.md](spec.md)

**Entrada**: especificação da funcionalidade em `specs/001-sorteio-alunos/spec.md`

## Resumo

Sistema web em Django para o professor do IF Baiano sortear alunos em sala. O professor
cria turmas, cola a lista copiada do SUAP (ou uma lista simples), confere a prévia e
confirma. Na tela de sorteio, o **servidor** escolhe o aluno com `secrets.choice` e o
marca como sorteado com UPDATE condicional dentro de uma transação (sem repetição, mesmo
com cliques simultâneos); o navegador recebe o resultado em JSON e o GSAP faz a fita de
nomes desacelerar e parar nele, com revelação letra a letra, confete e o voo do nome para
"Já sorteados". Reiniciar abre uma nova rodada mantendo o histórico; desfazer devolve o
último sorteado. Visual "Palco" de `docs/diretrizes-visuais.md`, com modo apresentação em
tela cheia e respeito a `prefers-reduced-motion`. Decisões técnicas em
[research.md](research.md).

## Contexto Técnico

**Linguagem/Versão**: Python 3 do `.venv/` com Django 6.1.1 (`requirements.txt`:
`Django>=5.2,<7`)

**Dependências principais**: Django (única dependência Python). Front-end via CDN, sem
build: Bootstrap 5.3 (grid, modais, toasts), Bootstrap Icons, Google Fonts (Bricolage
Grotesque, Figtree, JetBrains Mono), GSAP 3.13 (core + Flip + SplitText) e
canvas-confetti 1.9 pelo jsDelivr

**Armazenamento**: SQLite (`db.sqlite3` na raiz, fora do `.gitignore` a pedido), com
`OPTIONS = {'transaction_mode': 'IMMEDIATE', 'timeout': 20}`

**Testes**: somente testes manuais documentados (constituição, Princípio V) —
[quickstart.md](quickstart.md) e, na Etapa 6, `validacao.md`. Sem testes automatizados

**Plataforma-alvo**: navegador moderno (Chrome, Firefox, Edge) em notebook ligado a
projetor; também celular. Servidor de desenvolvimento do Django (`runserver`) local

**Tipo de projeto**: aplicação web monolítica Django (MVT), páginas renderizadas no
servidor com JavaScript progressivo

**Metas de desempenho**: resposta do POST `sortear` < 200 ms em máquina local; animação
a 60 fps (só `transform`/`opacity`); sorteio completo em 3–6 s (SC-005); prévia ao vivo
atualizada < 500 ms após colar

**Restrições**: regra de negócio só nos models/`importador.py`; POST + CSRF em toda
alteração; nenhum dado de aluno enviado a serviço externo; sem IA na importação; texto
colado limitado a 100.000 caracteres; interface 100% em Português do Brasil; tudo deve
funcionar (sem animação) se o JavaScript ou a CDN falharem

**Escala/Escopo**: 1 professor, dezenas de turmas, até ~60 alunos por turma, centenas de
sorteios por turma; 6 telas (início, nova turma/importar, sorteio, alunos, histórico,
admin)

## Verificação da Constituição

*PORTÃO: deve passar antes da Fase 0 e ser reavaliado depois da Fase 1.*

| Princípio | Exigência | Como o plano atende | Situação |
|---|---|---|---|
| I. Qualidade de código e idioma | PEP8; models CamelCase, campos snake_case | `Turma`, `Aluno`, `Sorteio`; campos `rodada_atual`, `nome_aluno`, `criado_em`… | ✅ |
| I | Regra só em models/serviços, nunca em template/JS | Regras nos métodos de `Aluno`/`Sorteio` e em `importador.py`; a prévia ao vivo chama o servidor em vez de repetir a regex no JS ([research.md §4](research.md)) | ✅ |
| I | Views enxutas | Views só validam form, chamam 1 método do model e usam `responder()` | ✅ |
| I | Schema por migration | `makemigrations` por app; unicidade (`Turma.chave`, `aluno_matricula_unica_por_turma`, `sorteio_ordem_unica_na_rodada`) nas migrations | ✅ |
| I | Português do Brasil | Código, comentários, mensagens, templates e docs em pt-BR | ✅ |
| II. Arquitetura MVT por domínio | Apps `turmas`, `alunos`, `sorteios` em `sorteio/` | Ver "Estrutura do projeto" | ✅ |
| II | FK com `related_name` | `turma.alunos`, `turma.sorteios`, `aluno.sorteios` | ✅ |
| II | POST + CSRF para alterar dados | Todas as ações no [contrato de rotas](contracts/rotas-http.md) com `@require_POST`; JS envia `X-CSRFToken` | ✅ |
| II | Sem duplicação entre Aluno e Sorteio | `Aluno` é dono da disponibilidade (`disponiveis`, `marcar_como_sorteado`, `devolver`, `devolver_todos`); `Sorteio` só orquestra e reutiliza; duplicidade só em `importador.mesmo_aluno` | ✅ |
| III. Regras invioláveis | Servidor escolhe com `secrets` | `Sorteio.sortear` usa `secrets.choice`; o JSON traz o nome; a animação só revela (RN-14) | ✅ |
| III | Sem repetição, marcação atômica | UPDATE condicional + `transaction.atomic` + SQLite IMMEDIATE + `UniqueConstraint(turma, rodada, ordem)` (RN-15) | ✅ |
| III | Isolamento por turma | Toda consulta parte de `turma.alunos`/`turma.sorteios`; rodada é campo da turma (RN-03) | ✅ |
| III | LGPD, importação sem IA | Regex local; CDN só para arquivos estáticos; sem analytics (research §10) | ✅ ⚠ ver ponto 2 abaixo |
| IV. Design de palco | Visual profissional, não genérico | Tokens de `docs/diretrizes-visuais.md` em `estilo.css`, sobrescrevendo o Bootstrap; skills de front-end na implementação | ✅ ⚠ ver ponto 1 |
| IV | Projetor, tela cheia, alto contraste | Modo apresentação (Fullscreen API), nome com `clamp()` até ~12vw, palco escuro | ✅ |
| IV | Animação com propósito + reduced-motion | Linha do tempo das diretrizes; alternativa sem movimento (research §6) | ✅ |
| V. Testes manuais | Cenário → esperado → obtido; sem testes automáticos | 30 cenários em [quickstart.md](quickstart.md) mapeados para FR/SC; `validacao.md` na Etapa 6 | ✅ |

**Resultado antes da Fase 0**: aprovado, sem violações.
**Reavaliação após a Fase 1** (data-model, contratos, quickstart): aprovado. O design
manteve cada regra com um único dono e não introduziu regra em template/JS.

## Estrutura do Projeto

### Documentação (desta feature)

```text
specs/001-sorteio-alunos/
├── spec.md              # especificação (/speckit-specify)
├── plan.md              # este arquivo (/speckit-plan)
├── research.md          # Fase 0: decisões técnicas
├── data-model.md        # Fase 1: models, regras, invariantes
├── quickstart.md        # Fase 1: roteiro de validação manual
├── contracts/
│   ├── rotas-http.md    # rotas, métodos, respostas e JSON
│   └── importador.md    # contrato das funções puras do importador
├── checklists/
│   └── requirements.md  # checklist de qualidade da spec
└── tasks.md             # Fase 2 (/speckit-tasks — ainda não criado)
```

### Código-fonte (raiz do repositório)

```text
manage.py
db.sqlite3                       # gerado pelo migrate (não ignorado no Git)
config/
├── settings.py                  # apps, SQLite IMMEDIATE, pt-br, America/Sao_Paulo, MESSAGE_TAGS
├── urls.py                      # admin/ + include de cada app
├── asgi.py
└── wsgi.py
sorteio/
├── apps.py                      # app "sorteio": templates e estáticos globais
├── regras.py                    # RegraNegocioError
├── respostas.py                 # e_ajax(), responder() — JSON ou toast + redirect
├── turmas/
│   ├── apps.py, admin.py, forms.py, urls.py, views.py
│   ├── models.py                # Turma, TurmaQuerySet.com_contagens()
│   ├── importador.py            # extrair_alunos, normalizar_espacos, chave_nome, mesmo_aluno
│   ├── migrations/
│   └── templates/turmas/
│       ├── importar.html        # nova turma e "colar mais uma lista" (prévia)
│       └── _previa.html         # lista da prévia (usada no servidor)
├── alunos/
│   ├── apps.py, admin.py, forms.py, urls.py, views.py
│   ├── models.py                # Aluno, AlunoQuerySet (disponiveis, previa, importar, adicionar…)
│   ├── migrations/
│   └── templates/alunos/
│       └── lista.html           # aba Alunos
├── sorteios/
│   ├── apps.py, admin.py, urls.py, views.py
│   ├── models.py                # Sorteio: sortear, desfazer_ultimo, reiniciar
│   ├── migrations/
│   └── templates/sorteios/
│       ├── palco.html           # aba Sorteio (roleta, listas, botões, modo apresentação)
│       └── historico.html       # aba Histórico (linha do tempo por rodada)
├── templates/
│   ├── base.html                # cabeçalho, CDNs, toasts, modal de confirmação
│   ├── index.html               # "Minhas turmas" (cards + estado vazio)
│   └── partials/
│       ├── _abas_turma.html     # cabeçalho da turma + abas Sorteio · Alunos · Histórico
│       ├── _modal_confirmacao.html
│       ├── _toasts.html
│       └── _estado_vazio.html
└── static/
    ├── css/estilo.css           # design tokens em :root + componentes
    ├── js/app.js                # toasts, modal data-confirmar, prévia ao vivo, busca, stagger, contadores
    ├── js/roleta.js             # animação do sorteio, atalhos, modo apresentação
    └── img/                     # logo / ilustrações do estado vazio
```

**Decisão de estrutura**: monólito Django seguindo o projeto de referência
`/home/felipe/Documentos/Trabalho02` — um app-pacote `sorteio` (templates globais,
estáticos, utilitários `regras.py`/`respostas.py`) com os três apps de domínio dentro.
As pastas `sorteio/turmas`, `sorteio/alunos`, `sorteio/sorteios`, `sorteio/templates` e
`sorteio/static` já existem; `manage.py` e os arquivos de `config/` serão criados.

## Responsabilidades por camada

| Camada | Faz | Não faz |
|---|---|---|
| `importador.py` | ler texto, normalizar, comparar alunos (funções puras) | acessar banco |
| Models | todas as regras RN-01..RN-20, transações, mensagens de erro | renderizar |
| Views | validar formulário, chamar um método, `responder()`/`render()` | decidir regra, sortear |
| Templates | exibir dados, `data-*` para o JS, `{% csrf_token %}` | calcular regra |
| `app.js` / `roleta.js` | animar, enviar POST, desenhar JSON, atalhos | escolher aluno, detectar duplicados, contar |

## Telas (resumo para a implementação)

Seguir fielmente `docs/diretrizes-visuais.md` (wireframes, paleta, fontes e linha do
tempo da animação). Pontos que o plano fixa:

- **Início**: cards com nome, "N alunos", anel de progresso "12 de 32", botão "Sortear →";
  card tracejado "+ Criar turma"; entrada em cascata (stagger) e elevação no hover; estado
  vazio com os 3 passos *Criar turma → Colar lista do SUAP → Sortear*.
- **Nova turma / importar**: duas colunas (formulário | prévia); instrução "Como copiar do
  SUAP"; contadores encontrados / novos / duplicados; duplicados riscados; botão
  "Confirmar importação".
- **Sorteio**: palco escuro com holofote (gradiente radial), fita com 3 nomes visíveis e o
  central entre linhas douradas; listas laterais com badges (disponível verde / sorteado
  cinza com ordem); botão SORTEAR grande; Reiniciar (modal) e Desfazer; botão ⛶; "Turma
  completa! 🎉" quando todos saírem.
- **Alunos**: busca (filtro visual), adicionar, colar mais uma lista, remover (modal),
  "Limpar lista" em zona de perigo.
- **Histórico**: linha do tempo por rodada ("Rodada 2 · hoje 10:42").
- **Comum**: toasts deslizando para as mensagens do Django; modal único de confirmação
  acionado por `data-confirmar`; foco visível; transições 150–300 ms; responsivo
  (celular com abas Disponíveis/Sorteados, notebook em 3 colunas, projetor em modo
  apresentação).
- **Skills na implementação**: `frontend-design` (direção estética antes de codar),
  `emil-design-eng`/`animate` (propósito, easing, interrupção, reduced-motion),
  `gsap-skills` (timelines, Flip, SplitText), `impeccable` (`audit` e `polish` no fim).

## Rastreabilidade (requisitos → onde são atendidos)

| Requisitos | Onde |
|---|---|
| FR-001..FR-005 | `turmas/models.py`, `turmas/views.py`, `index.html`, cascata FK |
| FR-006..FR-010, FR-013 | `turmas/importador.py`, `AlunoQuerySet.previa/importar`, `importar.html`, `app.js` (prévia ao vivo) |
| FR-011, FR-012, FR-015, FR-016 | `importador.mesmo_aluno`, `AlunoQuerySet.adicionar`, constraint de matrícula por turma |
| FR-017, FR-018 | `alunos/views.py` + `SET_NULL`/`nome_aluno` em `Sorteio` |
| FR-019..FR-027 | `Sorteio.sortear/reiniciar`, `palco.html`, `roleta.js` |
| FR-028..FR-030 | `Sorteio` (campos + `desfazer_ultimo`), `historico.html` |
| FR-031, FR-032 | `_modal_confirmacao.html`, `respostas.responder`, `_toasts.html` |
| FR-033..FR-036 | `roleta.js`, `estilo.css` (modo apresentação, reduced-motion), `aria-live` |
| FR-037 | ausência de chamadas externas com dados; CDNs só de arquivos estáticos |

## Acompanhamento de Complexidade

Nenhuma violação da constituição a justificar.

## Pontos para decisão do usuário

1. **Skills de front-end não estão instaladas.** `.claude/skills/` só tem os comandos
   `/speckit-*`; `frontend-design`, `emil-design-eng`, `gsap-skills` e `impeccable` não
   foram encontradas. Instalar antes do `/speckit-implement` (comandos em
   `docs/skills-frontend.md`, precisa de Node.js) ou seguir só com as diretrizes visuais?
2. **Banco versionado × LGPD.** O `db.sqlite3` ficará fora do `.gitignore`, como pedido.
   Se o repositório for enviado ao GitHub com turmas reais, os nomes e matrículas saem do
   computador local — o que a constituição proíbe. Sugestão: versionar o banco só com
   dados de demonstração (ou vazio). Confirmar.
3. **Sala sem internet.** Bootstrap, fontes e GSAP vêm de CDN ("sem baixar recursos");
   sem internet o sistema funciona, mas sem visual completo e sem animação. Manter assim
   ou permitir cópias locais em `sorteio/static/vendor/`?
4. **Decisões menores já tomadas** (mudar só se discordar):
   - "Reiniciar sorteio" fica indisponível quando ninguém foi sorteado na rodada atual.
   - Aluno removido depois de sorteado sai da lista "Já sorteados" da tela, mas continua
     no Histórico; a ordem dos demais não é renumerada.
   - Campo `descricao` (opcional) na turma, como no seu prompt, embora a spec não o exija.
   - Fuso `America/Sao_Paulo` (mesmo horário da Bahia), como já estava em `config/README.md`.
