---
description: "Lista de tarefas da implementação do Sorteio de Alunos por Turma"
---

# Tarefas: Sorteio de Alunos por Turma

**Entrada**: documentos de projeto em `specs/001-sorteio-alunos/`

**Pré-requisitos**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/rotas-http.md](contracts/rotas-http.md),
[contracts/importador.md](contracts/importador.md), [quickstart.md](quickstart.md)

**Testes**: a constituição (Princípio V) proíbe testes automatizados. Não há tarefas de
teste automático; cada história termina com uma tarefa de **validação manual** usando os
cenários numerados do [quickstart.md](quickstart.md).

**Organização**: tarefas agrupadas por história de usuário, para que cada uma possa ser
implementada e validada de forma independente.

**Regras válidas para TODAS as tarefas** (constituição):

- Código PEP8; models em CamelCase; campos, funções e variáveis em snake_case.
- Regra de negócio só nos models ou em `sorteio/turmas/importador.py`; nunca em templates
  ou JavaScript. Views enxutas: validar form → chamar um método → `responder()`/`render()`.
- Toda ação que altera dados: `@require_POST` + `{% csrf_token %}` (ou cabeçalho
  `X-CSRFToken` no `fetch`).
- Todo texto (código, comentários, docstrings, mensagens, templates) em Português do
  Brasil; nomes de tecnologias não são traduzidos.
- Nenhum dado de aluno enviado a serviço externo; CDNs só para arquivos estáticos.
- Interface conforme `docs/diretrizes-visuais.md`; toda animação com alternativa para
  `prefers-reduced-motion`.
- Usar `.venv/bin/python` para todos os comandos.

**Decisões pendentes do plan.md** (assumidas até o usuário responder): (1) usar as skills
`frontend-design`, `emil-design-eng`, `gsap-skills` e `impeccable` se estiverem instaladas;
senão, seguir só `docs/diretrizes-visuais.md`; (2) `db.sqlite3` fora do `.gitignore`, mas
sem turmas reais antes de qualquer commit; (3) bibliotecas via CDN, sem cópias locais.

## Formato: `[ID] [P?] [História] Descrição`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência pendente)
- **[USn]**: história de usuário da spec.md a que a tarefa pertence

---

## Fase 1: Preparação (infraestrutura compartilhada)

**Objetivo**: projeto Django executável com os quatro apps registrados.

- [X] T001 Criar `manage.py` na raiz (padrão do Django, `DJANGO_SETTINGS_MODULE='config.settings'`) e `config/asgi.py` e `config/wsgi.py` (mantendo `config/__init__.py` e `config/README.md` existentes), seguindo o modelo de `/home/felipe/Documentos/Trabalho02`
- [X] T002 [P] Criar os AppConfigs: `sorteio/apps.py` (`SorteioConfig`, `name='sorteio'`, `verbose_name='Sorteio de Alunos'`), `sorteio/turmas/apps.py` (`name='sorteio.turmas'`, `label='turmas'`, `verbose_name='Turmas'`), `sorteio/alunos/apps.py` (`name='sorteio.alunos'`, `label='alunos'`, `verbose_name='Alunos'`), `sorteio/sorteios/apps.py` (`name='sorteio.sorteios'`, `label='sorteios'`, `verbose_name='Sorteios'`), todos com `default_auto_field='django.db.models.BigAutoField'`; criar `migrations/__init__.py` vazio em cada um dos três apps de domínio
- [X] T003 Criar `config/settings.py`: `SECRET_KEY` lido de `DJANGO_SECRET_KEY` com valor de desenvolvimento como padrão; `DEBUG` lido de `DJANGO_DEBUG` (padrão `True`); `ALLOWED_HOSTS=['127.0.0.1', 'localhost']`; `INSTALLED_APPS` com os apps `django.contrib.*` + `'sorteio'`, `'sorteio.turmas'`, `'sorteio.alunos'`, `'sorteio.sorteios'`; `TEMPLATES` com `APP_DIRS=True`; `DATABASES` SQLite em `BASE_DIR / 'db.sqlite3'` com `'OPTIONS': {'transaction_mode': 'IMMEDIATE', 'timeout': 20}`; `LANGUAGE_CODE='pt-br'`; `TIME_ZONE='America/Sao_Paulo'`; `USE_I18N=True`; `USE_TZ=True`; `STATIC_URL='/static/'`; `STATIC_ROOT=BASE_DIR / 'staticfiles'`; `MESSAGE_TAGS` mapeando `messages.ERROR` para `'erro'`, `SUCCESS` para `'sucesso'`, `WARNING` para `'aviso'`, `INFO` para `'info'`
- [X] T004 Conferir que `.gitignore` NÃO contém `db.sqlite3` (pedido do usuário) e mantém `.venv/`, `__pycache__/`, `staticfiles/`; rodar `.venv/bin/python manage.py check` sem erros

---

## Fase 2: Fundação (pré-requisitos que bloqueiam todas as histórias)

**Objetivo**: models com constraints e migrations, utilitários de resposta, layout base,
design system e JS comum.

**⚠️ CRÍTICO**: nenhuma história começa antes desta fase terminar.

### Utilitários e regra pura

- [X] T005 [P] Criar `sorteio/regras.py` com `class RegraNegocioError(Exception)`, docstring: a mensagem é exibida diretamente ao usuário, em Português
- [X] T006 [P] Criar `sorteio/respostas.py` com `e_ajax(request)` (cabeçalho `X-Requested-With == 'XMLHttpRequest'`) e `responder(request, destino, mensagem, ok=True, dados=None, **url_kwargs)`: em AJAX devolve `JsonResponse({'ok': ok, 'mensagem': mensagem, **(dados or {})}, status=200 if ok else 409)`; senão usa `messages.success`/`messages.error` e redireciona para `next` (se seguro, via `url_has_allowed_host_and_scheme`) ou para `destino` (padrão de `Trabalho02/restaurante/respostas.py`)
- [X] T007 [P] Criar `sorteio/turmas/importador.py` (funções puras, sem import de models, sem rede) conforme [contracts/importador.md](contracts/importador.md): constante `PADRAO_SUAP = re.compile(r'Foto de\s*\n\s*(?P<nome>[^\n]+?)\s*\n\s*Matr[íi]cula:\s*(?P<matricula>\w+)', re.IGNORECASE)`; constante `TAMANHO_MAXIMO_NOME = 150`; `normalizar_espacos(texto)` = `" ".join(texto.split())`; `chave_nome(nome)` (NFKD, remove marcas combinantes, `casefold()`, espaços normalizados); `mesmo_aluno(a, b)` aceitando dicionário ou objeto com `nome`/`matricula` ("1. ambos têm matrícula e elas são iguais; ou 2. pelo menos um não tem matrícula e `chave_nome(a.nome) == chave_nome(b.nome)`"); `detectar_formato(texto) -> str` (`'suap'` se `PADRAO_SUAP` achar ≥ 1 aluno, senão `'lista'`); `extrair_alunos(texto) -> list[dict]` retornando `{'nome', 'matricula'}` (matrícula `''` quando ausente), trocando `\r\n`/`\r` por `\n`, usando SUAP se achar ≥ 1 aluno e lista simples caso contrário, descartando linhas com mais de 150 caracteres e removendo duplicados do próprio texto com `mesmo_aluno`; conferir no `manage.py shell` todas as linhas das tabelas do contrato

### Models e migrations

- [X] T008 Criar `Turma` em `sorteio/turmas/models.py`: `nome = CharField(max_length=80)` ("obrigatório; espaços extras removidos ao salvar; único sem diferenciar maiúsculas"), `descricao = CharField(max_length=200, blank=True)`, `rodada_atual = PositiveIntegerField(default=1)`, `criada_em = DateTimeField(auto_now_add=True)`; `Meta.ordering = ['nome']`; `Meta.constraints = [UniqueConstraint(Lower('nome'), name='turma_nome_unico')]`; `clean()` aplica `normalizar_espacos` e levanta `ValidationError({'nome': 'Já existe uma turma com esse nome.'})` se houver outra turma com `nome__iexact` igual (excluindo a própria); `save()` aplica `normalizar_espacos`; `TurmaQuerySet.com_contagens()` anotando `total_alunos=Count('alunos', distinct=True)` e `total_sorteados=Count('alunos', filter=Q(alunos__sorteado=True), distinct=True)`; `__str__` devolve `nome`; `verbose_name`/`verbose_name_plural` em Português
- [X] T009 Criar `Aluno` em `sorteio/alunos/models.py` (depende de T007, T008): `turma = ForeignKey('turmas.Turma', on_delete=CASCADE, related_name='alunos')`, `nome = CharField(max_length=150)` ("obrigatório; guardado como veio, só sem espaços extras"), `matricula = CharField(max_length=30, blank=True, default='')` ("opcional; única por turma quando preenchida; pode repetir em outra turma"), `sorteado = BooleanField(default=False, db_index=True)`, `criado_em = DateTimeField(auto_now_add=True)`; `Meta.ordering = ['nome']`; `Meta.constraints = [UniqueConstraint(fields=['turma', 'matricula'], condition=~Q(matricula=''), name='aluno_matricula_unica_por_turma')]`; `save()` aplica `normalizar_espacos` em `nome` e `matricula`; `AlunoQuerySet` (via `AlunoQuerySet.as_manager()`) com `disponiveis()` (`filter(sorteado=False)`), `sorteados()` (`filter(sorteado=True)`) e `devolver_todos()` (`update(sorteado=False)`); métodos de instância `marcar_como_sorteado() -> bool` (`Aluno.objects.filter(pk=self.pk, sorteado=False).update(sorteado=True) == 1`, e atualiza `self.sorteado`) e `devolver()` (`filter(pk=self.pk).update(sorteado=False)`); `__str__` devolve `nome`
- [X] T010 Criar `Sorteio` em `sorteio/sorteios/models.py` (depende de T009): `turma = ForeignKey('turmas.Turma', on_delete=CASCADE, related_name='sorteios')`, `aluno = ForeignKey('alunos.Aluno', on_delete=SET_NULL, null=True, blank=True, related_name='sorteios')`, `nome_aluno = CharField(max_length=150)`, `rodada = PositiveIntegerField()`, `ordem = PositiveIntegerField()`, `data_hora = DateTimeField(default=timezone.now)`; `Meta.ordering = ['-rodada', 'ordem']`; `Meta.constraints = [UniqueConstraint(fields=['turma', 'rodada', 'ordem'], name='sorteio_ordem_unica_na_rodada')]`; `SorteioQuerySet.da_rodada_atual(turma)` = `filter(turma=turma, rodada=turma.rodada_atual)`; `__str__` no formato `"3º — NOME (rodada 1)"`
- [X] T011 Gerar e aplicar as migrations: `.venv/bin/python manage.py makemigrations turmas alunos sorteios` e `migrate`; conferir que as três constraints aparecem nos arquivos `sorteio/*/migrations/0001_initial.py`
- [X] T012 [P] Registrar os models no admin: `sorteio/turmas/admin.py` (`list_display` nome, rodada_atual, criada_em; `search_fields` nome), `sorteio/alunos/admin.py` (`list_display` nome, matricula, turma, sorteado; `list_filter` turma, sorteado; `search_fields` nome, matricula), `sorteio/sorteios/admin.py` (`list_display` turma, rodada, ordem, nome_aluno, data_hora; `list_filter` turma, rodada)

### Rotas e layout

- [X] T013 Criar `config/urls.py` (`admin/`, `''` → `include('sorteio.turmas.urls')`, `'alunos/'` → `include('sorteio.alunos.urls')`, `'sorteio/'` → `include('sorteio.sorteios.urls')`) e os arquivos `sorteio/turmas/urls.py`, `sorteio/alunos/urls.py`, `sorteio/sorteios/urls.py` com `app_name` = `'turmas'`, `'alunos'`, `'sorteios'` e `urlpatterns = []` (as rotas são adicionadas em cada história, conforme [contracts/rotas-http.md](contracts/rotas-http.md))
- [X] T014 Definir a direção estética antes de escrever CSS (skill `frontend-design`, se instalada), partindo do conceito "Palco" de `docs/diretrizes-visuais.md`; registrar a direção em um comentário no topo de `sorteio/static/css/estilo.css`
- [X] T015 Criar os design tokens em `:root` de `sorteio/static/css/estilo.css`: cores `--verde: #1F8A4C`, `--ouro: #F5B83D`, `--palco: #0E1512`, `--papel: #F7F6F1`, `--tinta: #17201B`, `--cinza: #8A948E` (e variações claras/escuras derivadas); fontes `--fonte-display: 'Bricolage Grotesque'`, `--fonte-texto: 'Figtree'`, `--fonte-mono: 'JetBrains Mono'` (proibido Inter, Roboto, Arial, Space Grotesk); escala de espaçamentos; raios 16–24 px; sombras suaves; `--easing: cubic-bezier(.2,.8,.2,1)`; durações 150/200/300 ms; sobrescrever as variáveis `--bs-*` do Bootstrap (cores, fonte, raio) para não parecer Bootstrap padrão; estilos base (corpo em `--papel`/`--tinta`, títulos em `--fonte-display`, foco visível em todo elemento interativo) e bloco `@media (prefers-reduced-motion: reduce)` zerando transições/animações CSS
- [X] T016 Criar componentes em `sorteio/static/css/estilo.css`: botões (primário verde, secundário, perigo; micro-interação ao pressionar `scale(.97)`), cards arredondados com sombra e elevação no hover, badges (`.badge-disponivel` verde, `.badge-sorteado` cinza com ordem), campos de formulário, toasts deslizando no canto, modal de confirmação, abas da turma, estado vazio (ícone + texto convidativo) e zona de perigo
- [X] T017 Criar `sorteio/templates/base.html`: `lang="pt-BR"`; `<meta viewport>`; CDNs com versões fixas — Bootstrap 5.3 CSS/JS bundle, Bootstrap Icons, Google Fonts (Bricolage Grotesque, Figtree, JetBrains Mono, `display=swap`), `gsap@3.13` (`gsap.min.js`, `Flip.min.js`, `SplitText.min.js`) e `canvas-confetti@1.9` pelo jsDelivr, todos com `defer`; `{% static 'css/estilo.css' %}` e `{% static 'js/app.js' %}`; blocos `title`, `conteudo`, `scripts`, `classe_body`; cabeçalho com logo "Sorteio" (link para `turmas:index`) e botão "+ Nova turma"; inclui `partials/_toasts.html` e `partials/_modal_confirmacao.html`
- [X] T018 [P] Criar os parciais em `sorteio/templates/partials/`: `_toasts.html` (renderiza `messages` como toasts com a classe de `MESSAGE_TAGS`, `role="status"`), `_modal_confirmacao.html` (modal único do Bootstrap com título, texto e botões "Cancelar"/"Confirmar", preenchido pelo JS), `_estado_vazio.html` (recebe ícone, título, texto e ação via `{% include ... with %}`) e `_abas_turma.html` (cabeçalho com o nome da turma e, por enquanto, só a aba **Sorteio** apontando para `sorteios:palco`; as abas Alunos e Histórico são adicionadas em US4 e US5)
- [X] T019 Criar `sorteio/static/js/app.js` (sem framework, em um IIFE que expõe `window.Sorteio`): `lerCookie('csrftoken')`; `enviarPost(url, dados)` com `fetch`, `X-CSRFToken`, `X-Requested-With: XMLHttpRequest` e retorno do JSON; `mostrarToast(mensagem, tipo)`; exibição automática dos toasts do Django com entrada deslizante e saída após ~4 s; interceptação de todo `form[data-confirmar]` abrindo `_modal_confirmacao` e só enviando após "Confirmar"; `animarNumero(elemento, valor)` para contadores (GSAP se disponível; troca direta sem GSAP ou com `prefers-reduced-motion`); constante `REDUZIR_MOVIMENTO` a partir de `matchMedia('(prefers-reduced-motion: reduce)')`

**Checkpoint**: `manage.py check` sem erros, migrations aplicadas, `/admin/` lista os três
models; a fundação está pronta.

---

## Fase 3: História de Usuário 1 — Criar turma e importar a lista do SUAP (Prioridade: P1) 🎯 MVP

**Meta**: o professor cria uma turma, cola a lista (SUAP ou simples), confere a prévia e
confirma; os alunos aparecem na tela da turma.

**Teste independente**: criar a turma "Teste", colar os 32 alunos de
`docs/importacao-suap.md`, conferir "32 encontrados, 32 novos, 0 duplicados", confirmar e
ver os 32 na lista "Disponíveis".

### Implementação da História 1

- [X] T020 [US1] Adicionar a `AlunoQuerySet` em `sorteio/alunos/models.py` uma dataclass `PreviaImportacao` (`alunos: list[dict]` com chave extra `duplicado: bool`, `encontrados`, `novos`, `duplicados`, `formato` `'suap'`/`'lista'`) e os métodos `previa(itens, formato='lista')` (compara cada item com os alunos existentes da turma usando `importador.mesmo_aluno`) e `importar(itens)` (em `transaction.atomic()`: refaz `previa`, cria só os não duplicados com `bulk_create`, todos com `sorteado=False` (RN-10), devolve a `PreviaImportacao` usada); o campo `formato` é recebido da view, que o obtém com `importador.detectar_formato(texto)`; `importar(itens, formato='lista')` repassa o mesmo valor
- [X] T021 [US1] Adicionar a `sorteio/turmas/models.py` o manager `TurmaQuerySet.criar_com_lista(nome, descricao, texto)` que, em `transaction.atomic()`, cria a turma (com `full_clean()`) e chama `turma.alunos.importar(extrair_alunos(texto))`, devolvendo `(turma, previa)`
- [X] T022 [P] [US1] Criar `sorteio/turmas/forms.py`: `TurmaForm` (ModelForm com `nome` e `descricao`, rótulos e placeholders em Português, `nome` obrigatório) e `ImportarListaForm` (`texto = CharField(widget=Textarea, required=False, max_length=100_000)` com a mensagem "O texto colado é grande demais." e `acao = ChoiceField(choices=[('previa', 'Ver prévia'), ('confirmar', 'Confirmar importação')])`)
- [X] T023 [US1] Implementar em `sorteio/turmas/views.py` as views `index` (GET, `Turma.objects.com_contagens()`), `nova` (GET formulário; POST `acao=previa` renderiza a prévia sem salvar calculando-a com `Aluno.objects.none().previa(itens, formato)` (turma ainda não existe, tudo é novo); POST `acao=confirmar` chama `Turma.objects.criar_com_lista` e redireciona para `sorteios:palco` com toast "Turma criada com N alunos."), `previa_nova` (POST, JSON da prévia para turma ainda não criada), `importar` (GET/POST com `acao`, sobre `turma.alunos.previa`/`importar`, toast "N alunos importados, M já estavam na turma."; enquanto US4 não existir, redirecionar para `sorteios:palco`) e `previa` (POST, JSON da prévia comparando com a turma); texto vazio na confirmação → erro "Nenhum aluno encontrado." sem salvar (exceto na criação da turma, que pode ficar sem alunos); formatos de JSON exatamente como em [contracts/rotas-http.md](contracts/rotas-http.md)
- [X] T024 [US1] Registrar as rotas em `sorteio/turmas/urls.py`: `''` → `index`, `'turmas/nova/'` → `nova`, `'turmas/previa/'` → `previa_nova`, `'turmas/<int:turma_id>/importar/'` → `importar`, `'turmas/<int:turma_id>/previa/'` → `previa` (nomes iguais ao contrato); `previa_nova`, `previa` com `@require_POST`
- [X] T025 [US1] Criar a tela da turma em modo leitura: view `palco` (GET) em `sorteio/sorteios/views.py` com contexto `turma`, `disponiveis` (`turma.alunos.disponiveis()`), `sorteados` (`Sorteio.objects.da_rodada_atual(turma).filter(aluno__isnull=False).select_related('aluno')` por `ordem`) e contadores; rota `'<int:turma_id>/'` nome `palco` em `sorteio/sorteios/urls.py`; template `sorteio/sorteios/templates/sorteios/palco.html` estendendo `base.html` com `_abas_turma.html`, três colunas (Disponíveis | palco | Já sorteados), itens com `data-aluno-id` e `data-nome`, contadores com `data-contador="disponiveis"`/`"sorteados"`, badges, e estado vazio "A turma ainda não tem alunos" com link para `turmas:importar`
- [X] T026 [P] [US1] Criar `sorteio/templates/index.html`: grade de cards (nome, "N alunos", anel de progresso SVG "X de N sorteados", botão "Sortear →" para `sorteios:palco`), card tracejado "+ Criar turma" e estado vazio com os 3 passos *Criar turma → Colar lista do SUAP → Sortear*
- [X] T027 [P] [US1] Criar `sorteio/turmas/templates/turmas/importar.html` (usado por `nova` e `importar`): duas colunas — formulário (nome e descrição só na criação, `<textarea>` grande com `data-url-previa`, bloco "Como copiar do SUAP" com os passos) | prévia (inclui `_previa.html`); botões "Ver prévia" (`acao=previa`) e "Confirmar importação" (`acao=confirmar`); e `sorteio/turmas/templates/turmas/_previa.html` com contadores encontrados / novos / duplicados, lista nome + matrícula (matrícula em `--fonte-mono`), duplicados riscados e aviso "Nenhum aluno encontrado" quando vazio
- [X] T028 [US1] Adicionar a `sorteio/static/js/app.js` a prévia ao vivo: em textareas com `data-url-previa`, após 400 ms sem digitar/colar, `enviarPost` com o texto; desenhar a lista e animar os contadores com o JSON recebido (sem nenhuma regra de leitura ou duplicidade no JS); e a entrada em cascata (stagger) dos cards de `index.html` com GSAP, desligada em `REDUZIR_MOVIMENTO`
- [X] T029 [P] [US1] Estilizar em `sorteio/static/css/estilo.css` a tela inicial (grade responsiva de cards, anel de progresso, card tracejado, estado vazio em 3 passos) e a tela de importação (duas colunas no notebook, uma no celular; textarea grande; painel de prévia com contadores; duplicados riscados)
- [X] T030 [US1] Validação manual: executar os cenários 1 a 7 do [quickstart.md](quickstart.md) e anotar os resultados obtidos para o `validacao.md`

**Checkpoint**: História 1 funcional e validável sozinha (MVP de cadastro).

---

## Fase 4: História de Usuário 2 — Sortear um aluno (Prioridade: P1)

**Meta**: clicar em "Sortear" faz os nomes girarem, desacelerarem e pararem no aluno
escolhido pelo servidor, sem repetição.

**Teste independente**: em uma turma com 3 alunos (importados pela US1, ou cadastrados no
`/admin` após `.venv/bin/python manage.py createsuperuser`), sortear 3 vezes: 3 nomes diferentes; depois o botão fica desabilitado com
"Todos os alunos já foram sorteados. Reinicie o sorteio."

### Implementação da História 2

- [X] T031 [US2] Implementar `Sorteio.sortear(turma)` (`@classmethod`) em `sorteio/sorteios/models.py` exatamente como em [data-model.md](data-model.md): `transaction.atomic()`; `Turma.objects.select_for_update().get(pk=turma.pk)`; turma sem alunos → `RegraNegocioError('A turma não tem alunos. Importe a lista para começar.')`; lista de ids de `turma.alunos.disponiveis()` vazia → `RegraNegocioError('Todos os alunos já foram sorteados. Reinicie o sorteio.')`; `secrets.choice(ids)`; `aluno.marcar_como_sorteado()` e, se `False`, repetir (no máximo 3 tentativas); `ordem = (Max('ordem') da rodada atual or 0) + 1`; criar o `Sorteio` com `nome_aluno=aluno.nome` e `rodada=turma.rodada_atual`; devolver o registro
- [X] T032 [US2] Implementar a view `sortear` (`@require_POST`) em `sorteio/sorteios/views.py` e a rota `'<int:turma_id>/sortear/'` nome `sortear` em `sorteio/sorteios/urls.py`: chama `Sorteio.sortear`; em AJAX responde `{"ok": true, "id": <pk do aluno>, "nome", "ordem", "rodada", "disponiveis", "sorteados"}`; `RegraNegocioError` → 409 `{"ok": false, "mensagem", "disponiveis", "sorteados"}`; sem AJAX → redireciona para `sorteios:palco` com toast "Nº sorteado: NOME"
- [X] T033 [US2] Completar `sorteio/sorteios/templates/sorteios/palco.html`: palco escuro com holofote; janela da fita com 3 nomes visíveis e o central entre linhas douradas; área de revelação do nome e da ordem ("3º sorteado"); região `aria-live="polite"`; formulário POST do botão **SORTEAR** (funciona sem JS) com `data-url-sortear`; botão desabilitado com a mensagem de RN-17 quando `disponiveis` estiver vazio e com a sugestão de importar (RN-18) quando a turma não tiver alunos; incluir `{% static 'js/roleta.js' %}` no bloco `scripts`
- [X] T034 [US2] Criar `sorteio/static/js/roleta.js` (usar a skill `gsap-skills`/`emil-design-eng`, se instaladas) seguindo [research.md §6](research.md) e a linha do tempo de `docs/diretrizes-visuais.md`: no clique ou `Espaço`, desabilitar o botão e mostrar "Sorteando…"; iniciar um loop linear da fita (nomes lidos de `data-nome` da lista Disponíveis, embaralhados só para exibição); `Sorteio.enviarPost(urlSortear)`; ao receber o JSON, encerrar o loop, inserir `nome` alguns itens à frente e desacelerar até ele com `power4.out`, garantindo 3–6 s desde o clique; parada com `back.out`; revelação letra a letra com `SplitText` + texto "Nº sorteado"; confete verde e ouro com `canvas-confetti`; mover o item `data-aluno-id` de Disponíveis para Já sorteados com `Flip` (com badge da ordem) — se o item não existir no DOM (aluno incluído em outra aba), criá-lo direto em Já sorteados com o `nome` e a `ordem` do JSON; animar os contadores com `disponiveis`/`sorteados`; anunciar "Sorteado: NOME" no `aria-live`; reabilitar o botão (ou mantê-lo desabilitado com a mensagem de RN-17 se `disponiveis == 0`). O JavaScript NUNCA escolhe, filtra ou altera o resultado
- [X] T035 [US2] Tratar em `sorteio/static/js/roleta.js` os caminhos alternativos: `Espaço`/`Enter`/`Esc` durante a animação levam a timeline ao fim (`progress(1)`) sem iniciar outro sorteio; cliques extras ignorados enquanto a animação roda; resposta 409 mostra a mensagem em toast e atualiza o estado do botão; erro de rede ou tempo acima de 8 s encerra o loop sem parar em nenhum nome, mostra toast "Não foi possível sortear. Tente de novo." e reabilita o botão; com `REDUZIR_MOVIMENTO` ou sem GSAP: sem fita, sem confete e sem Flip — o nome aparece com `opacity` 0→1 em ~200 ms e as listas são atualizadas diretamente
- [X] T036 [P] [US2] Estilizar o palco em `sorteio/static/css/estilo.css`: fundo `--palco` com gradiente radial de holofote, fita com máscara de desfoque nas bordas, linhas douradas `--ouro`, nome sorteado em `--fonte-display` com `clamp()` grande, brilho dourado no vencedor, botão SORTEAR enorme, listas laterais com badges e contadores grandes, layout de 3 colunas no notebook; animar apenas `transform` e `opacity`
- [X] T037 [US2] Validação manual: executar os cenários 8 a 11 e 30 do [quickstart.md](quickstart.md) (incluindo duplo clique ×10 e duas abas) e anotar os resultados obtidos

**Checkpoint**: Histórias 1 e 2 funcionam — o sistema já sorteia sem repetir.

---

## Fase 5: História de Usuário 3 — Reiniciar o sorteio (Prioridade: P1)

**Meta**: com confirmação, todos voltam a ficar disponíveis em uma nova rodada; o histórico
anterior é mantido.

**Teste independente**: sortear 2 alunos, reiniciar e confirmar: todos em "Disponíveis",
"Já sorteados" vazio, "Rodada 2"; os 2 sorteios anteriores continuam no banco (`/admin`).

### Implementação da História 3

- [X] T038 [US3] Implementar `Sorteio.reiniciar(turma)` (`@classmethod`) em `sorteio/sorteios/models.py`: `transaction.atomic()`; se nenhum aluno estiver sorteado na rodada atual → `RegraNegocioError('Nenhum aluno foi sorteado nesta rodada.')`; `turma.alunos.devolver_todos()`; `Turma.objects.filter(pk=turma.pk).update(rodada_atual=F('rodada_atual') + 1)`; nunca apagar registros de `Sorteio`
- [X] T039 [US3] Implementar a view `reiniciar` (`@require_POST`) em `sorteio/sorteios/views.py` e a rota `'<int:turma_id>/reiniciar/'` nome `reiniciar` em `sorteio/sorteios/urls.py`: chama `Sorteio.reiniciar` e usa `responder()` para `sorteios:palco` com toast "Sorteio reiniciado. Rodada N." ou a mensagem de erro
- [X] T040 [US3] Atualizar `sorteio/sorteios/templates/sorteios/palco.html`: botão "↺ Reiniciar sorteio" em formulário POST com `data-confirmar="Todos os alunos voltarão a ficar disponíveis. O histórico será mantido."`, desabilitado quando nenhum aluno foi sorteado na rodada; indicador "Rodada N"; estado "Turma completa! 🎉" no palco quando todos saírem, com o botão principal virando "Reiniciar sorteio" (mesmo formulário com confirmação)
- [X] T041 [US3] Validação manual: executar o cenário 14 do [quickstart.md](quickstart.md) (cancelar e confirmar) e anotar os resultados obtidos

**Checkpoint**: as três histórias P1 funcionam — ciclo completo importar → sortear →
reiniciar.

---

## Fase 6: História de Usuário 4 — Gerenciar turmas e a lista de alunos (Prioridade: P2)

**Meta**: aba Alunos (adicionar, remover, colar mais uma lista, limpar) e renomear/excluir
turma.

**Teste independente**: adicionar "Aluno Novo" → aparece em Disponíveis; remover um aluno
→ some das listas; limpar a lista (com confirmação) → turma vazia mas existente; renomear a
turma; excluir outra turma (com confirmação) → some da tela inicial.

### Implementação da História 4

- [X] T042 [US4] Adicionar `AlunoQuerySet.adicionar(nome, matricula='')` em `sorteio/alunos/models.py`: normaliza com `normalizar_espacos`; se `mesmo_aluno` encontrar alguém na turma → `RegraNegocioError('Esse aluno já está na turma.')`; senão cria com `sorteado=False` (RN-10) e devolve o aluno
- [X] T043 [P] [US4] Criar `sorteio/alunos/forms.py` com `AlunoForm` (`nome` obrigatório, `max_length=150`; `matricula` opcional, `max_length=30`; rótulos e placeholders em Português)
- [X] T044 [US4] Implementar em `sorteio/alunos/views.py` as views `lista` (GET; contexto com alunos da turma, badges disponível/já sorteado com a ordem da rodada atual), `adicionar` (`@require_POST`, `AlunoForm` → `turma.alunos.adicionar` → `responder()` com "Aluno adicionado."), `remover` (`@require_POST`, apaga o aluno → "Aluno removido.") e `limpar` (`@require_POST`, `turma.alunos.all().delete()` → "Lista limpa. A turma continua cadastrada."); rotas em `sorteio/alunos/urls.py`: `'turma/<int:turma_id>/'` `lista`, `'turma/<int:turma_id>/adicionar/'` `adicionar`, `'<int:aluno_id>/remover/'` `remover`, `'turma/<int:turma_id>/limpar/'` `limpar`
- [X] T045 [US4] Criar `sorteio/alunos/templates/alunos/lista.html`: `_abas_turma.html`; campo de busca; formulário "+ Adicionar aluno" (nome + matrícula opcional); link "Colar mais uma lista" para `turmas:importar`; lista em cards/linhas (nada de tabela crua) com nome, matrícula em `--fonte-mono`, badge e botão lixeira em formulário POST com `data-confirmar`; zona de perigo no rodapé com "Limpar lista" (`data-confirmar`); estado vazio com convite para importar
- [X] T046 [US4] Adicionar a aba **Alunos** (link para `alunos:lista`) em `sorteio/templates/partials/_abas_turma.html` e mudar o redirecionamento de sucesso da view `importar` em `sorteio/turmas/views.py` para `alunos:lista` (conforme o contrato)
- [X] T047 [US4] Implementar em `sorteio/turmas/views.py` as views `renomear` (`@require_POST`, valida com `TurmaForm(instance=turma)` — mesmo `clean()` do model — e `responder()` com "Turma renomeada." ou o erro) e `excluir` (`@require_POST`, apaga a turma e redireciona para `turmas:index` com "Turma excluída."); rotas `'turmas/<int:turma_id>/renomear/'` `renomear` e `'turmas/<int:turma_id>/excluir/'` `excluir` em `sorteio/turmas/urls.py`
- [X] T048 [US4] Adicionar ao cabeçalho de `sorteio/templates/partials/_abas_turma.html` a ação "Renomear" (formulário POST inline com o nome atual) e, na zona de perigo de `sorteio/alunos/templates/alunos/lista.html` (longe do palco projetado), "Excluir turma" (formulário POST com `data-confirmar="A turma, seus alunos e todo o histórico serão apagados."`)
- [X] T049 [P] [US4] Adicionar a `sorteio/static/js/app.js` o filtro da busca da aba Alunos (esconde/mostra itens comparando o texto digitado com `data-nome`, só exibição) (adicionar e remover usam envio normal do formulário com recarga da página e toast — sem AJAX, conforme o contrato)
- [X] T050 [P] [US4] Estilizar em `sorteio/static/css/estilo.css` a aba Alunos (busca, formulário de adicionar, itens com badge, zona de perigo em vermelho discreto) e as ações do cabeçalho da turma
- [X] T051 [US4] Validação manual: executar os cenários 4, 15 a 21 do [quickstart.md](quickstart.md) e anotar os resultados obtidos

**Checkpoint**: Histórias 1 a 4 funcionam de forma independente.

---

## Fase 7: História de Usuário 5 — Histórico e desfazer o último sorteio (Prioridade: P3)

**Meta**: linha do tempo por rodada e "Desfazer último" para aluno ausente.

**Teste independente**: sortear 3 alunos, abrir o Histórico (ordem e horário), clicar em
"Desfazer último": o 3º volta a Disponíveis e sai do Histórico.

### Implementação da História 5

- [X] T052 [US5] Implementar `Sorteio.desfazer_ultimo(turma)` (`@classmethod`) em `sorteio/sorteios/models.py`: `transaction.atomic()`; pega o sorteio de maior `ordem` em `da_rodada_atual(turma)`; nenhum → `RegraNegocioError('Não há sorteio para desfazer nesta rodada.')`; se `aluno` existir → `aluno.devolver()`; apaga o registro e o devolve
- [X] T053 [US5] Implementar as views `desfazer` (`@require_POST`; AJAX → `{"ok": true, "mensagem": "Desfeito: NOME", "id": <pk do aluno ou null>, "disponiveis", "sorteados"}`; sem AJAX → toast e `sorteios:palco`) e `historico` (GET; `turma.sorteios.all()` agrupado por rodada) em `sorteio/sorteios/views.py`; rotas `'<int:turma_id>/desfazer/'` `desfazer` e `'<int:turma_id>/historico/'` `historico` em `sorteio/sorteios/urls.py`
- [X] T054 [US5] Criar `sorteio/sorteios/templates/sorteios/historico.html`: `_abas_turma.html`; linha do tempo com `{% regroup %}` por `rodada` ("Rodada 2 · hoje 10:42", usando a data do primeiro sorteio da rodada), itens com ordem, `nome_aluno` e horário `H:i`; estado vazio "Nenhum sorteio ainda"
- [X] T055 [US5] Adicionar a aba **Histórico** (link para `sorteios:historico`) em `sorteio/templates/partials/_abas_turma.html` e o botão "↶ Desfazer último" em formulário POST com `data-url-desfazer` em `sorteio/sorteios/templates/sorteios/palco.html`, desabilitado quando a rodada atual não tiver sorteios
- [X] T056 [US5] Adicionar a `sorteio/static/js/roleta.js` o desfazer via AJAX: `enviarPost(urlDesfazer)`; com o JSON, mover o item `data-aluno-id` de Já sorteados para Disponíveis com `Flip` (ou direto em `REDUZIR_MOVIMENTO`), atualizar contadores e o estado dos botões, toast com a mensagem
- [X] T057 [P] [US5] Estilizar a linha do tempo do Histórico em `sorteio/static/css/estilo.css` (marcadores por rodada, ordem em destaque, horários em `--cinza`)
- [X] T058 [US5] Validação manual: executar os cenários 12, 13 e 22 do [quickstart.md](quickstart.md) e anotar os resultados obtidos

**Checkpoint**: Histórias 1 a 5 funcionam.

---

## Fase 8: História de Usuário 6 — Sortear com a turma assistindo no projetor (Prioridade: P3)

**Meta**: modo apresentação em tela cheia, atalhos de teclado e acessibilidade.

**Teste independente**: ativar o modo apresentação, sortear pelo teclado, conferir a
legibilidade de longe; ativar "reduzir movimento" no sistema e conferir a revelação sem
giro.

### Implementação da História 6

- [X] T059 [US6] Adicionar a `sorteio/sorteios/templates/sorteios/palco.html` o botão "⛶ Modo apresentação" (ícone Bootstrap Icons, `aria-label`) e a dica visual dos atalhos (`Espaço` sortear · `F` tela cheia · `Z` desfazer)
- [X] T060 [US6] Implementar em `sorteio/static/js/roleta.js` o modo apresentação (`requestFullscreen`/`exitFullscreen` no contêiner do palco + classe `modo-apresentacao`, sincronizada com o evento `fullscreenchange`) e os atalhos `F` (alternar tela cheia) e `Z` (enviar o formulário "Desfazer último"), ignorados quando o foco estiver em `input`/`textarea`/`select` ou com um modal aberto
- [X] T061 [P] [US6] Estilizar `.modo-apresentacao` em `sorteio/static/css/estilo.css`: esconde cabeçalho, abas e listas; palco ocupa a tela; nome sorteado com `clamp()` chegando a ~12vw; botão SORTEAR grande; contraste alto (texto claro sobre `--palco`, ouro no vencedor)
- [X] T062 [US6] Conferir acessibilidade em `palco.html`/`roleta.js`: anúncio "Sorteado: NOME" no `aria-live`, foco visível em todos os botões, rótulos acessíveis nos botões só com ícone, ordem de tabulação lógica
- [X] T063 [US6] Validação manual: executar os cenários 23 a 26 do [quickstart.md](quickstart.md) e anotar os resultados obtidos

**Checkpoint**: todas as histórias funcionam de forma independente.

---

## Fase 9: Acabamento e itens transversais

**Objetivo**: responsividade, polimento visual, conformidade e validação final.

- [X] T064 [P] Responsividade em `sorteio/static/css/estilo.css` e `sorteio/static/js/app.js`: no celular, palco no topo e listas Disponíveis/Sorteados em abas; notebook em 3 colunas; conferir todas as telas em 375 px, 1366 px e 1920 px
- [X] T065 [P] Padronizar o rótulo "Já sorteados" em toda a interface e revisar micro-interações e estados vazios em todos os templates de `sorteio/templates/`, `sorteio/*/templates/`: toasts, modal, foco visível, transições 150–300 ms com `--easing`, nenhum estado de tela em branco
- [X] T066 Rodar `/impeccable audit` e `/impeccable polish` (e `review-animations` em `sorteio/static/js/roleta.js`), se as skills estiverem instaladas; aplicar as correções sem quebrar as regras da constituição
- [X] T067 Revisar conformidade: nenhuma regra de negócio em `sorteio/**/templates/**` ou `sorteio/static/js/*.js` (JS não escolhe aluno, não detecta duplicados, não conta); todas as views que alteram dados com `@require_POST`; todos os textos em Português do Brasil; PEP8 nos arquivos `.py`
- [X] T068 Revisar privacidade (FR-037, SC-009): nenhum `fetch`/`<script>`/`<link>` externo além das CDNs listadas em `sorteio/templates/base.html`; nenhuma URL externa recebe nome ou matrícula; nada de analytics
- [X] T069 Rodar `.venv/bin/python manage.py check` e `.venv/bin/python manage.py makemigrations --check --dry-run` (sem migrations pendentes)
- [X] T070 [P] Atualizar `README.md` (tabela de etapas: Implement concluída; como iniciar o servidor) e, se necessário, os `README.md` de `config/` e dos apps para refletir os arquivos reais
- [X] T071 Executar todos os 30 cenários do [quickstart.md](quickstart.md) e registrar em `specs/001-sorteio-alunos/validacao.md` a tabela Requisito (FR-xxx/SC-xxx) | Cenário | Resultado esperado | Resultado obtido | OK? — sem marcar OK para cenário não executado (Etapa 6)
- [X] T072 Antes de qualquer commit: garantir que `db.sqlite3` não contém turmas reais (apenas dados de demonstração ou banco vazio), conforme a LGPD e a decisão pendente 2 do `plan.md`

---

## Dependências e ordem de execução

### Dependências entre fases

- **Preparação (Fase 1)**: sem dependências.
- **Fundação (Fase 2)**: depende da Fase 1 — BLOQUEIA todas as histórias.
- **Histórias (Fases 3–8)**: dependem da Fase 2.
- **Acabamento (Fase 9)**: depende das histórias desejadas.

### Dependências entre histórias

- **US1 (P1)**: só depende da Fundação. Cria a tela da turma em modo leitura (T025), usada pelas demais.
- **US2 (P1)**: depende da Fundação e de T025 (`palco.html`/view `palco`). Alunos podem vir da US1 ou do `/admin` — testável sem o resto da US1.
- **US3 (P1)**: depende de T025; para validar precisa de sorteios (US2 ou registros criados no `/admin`).
- **US4 (P2)**: depende da Fundação; T046 altera a view `importar` da US1 (se a US1 não existir, pular só essa parte).
- **US5 (P3)**: depende de T025; validação usa sorteios da US2.
- **US6 (P3)**: depende da US2 (`roleta.js`).

### Dentro de cada história

- Model/regra → view + rota → template → JS → CSS → validação manual.
- Tarefas no mesmo arquivo (`estilo.css`, `app.js`, `roleta.js`, `palco.html`) são sequenciais entre si.

### Oportunidades de paralelismo

- Fase 1: T002 em paralelo com T001.
- Fase 2: T005, T006, T007 juntos; T012 e T018 depois dos models/rotas.
- US1: T022, T026, T027 e T029 em paralelo depois de T020–T021.
- US2: T036 (CSS) em paralelo com T031–T032.
- US4: T043, T049 e T050 em paralelo com as views.
- Acabamento: T064, T065 e T070 em paralelo.

---

## Exemplo de paralelismo: História 1

```text
# Depois de T020 e T021 (regras de prévia/importação prontas):
Tarefa: "T022 [US1] forms em sorteio/turmas/forms.py"
Tarefa: "T026 [US1] index.html em sorteio/templates/index.html"
Tarefa: "T027 [US1] importar.html e _previa.html em sorteio/turmas/templates/turmas/"
Tarefa: "T029 [US1] estilos da tela inicial e da importação em sorteio/static/css/estilo.css"
```

## Exemplo de paralelismo: História 2

```text
# Regra e interface ao mesmo tempo:
Tarefa: "T031 [US2] Sorteio.sortear em sorteio/sorteios/models.py"
Tarefa: "T036 [US2] estilos do palco em sorteio/static/css/estilo.css"
```

---

## Estratégia de implementação

### MVP primeiro (P1: Histórias 1, 2 e 3)

1. Fase 1 (Preparação) → Fase 2 (Fundação).
2. Fase 3 (US1) → **PARAR E VALIDAR** cenários 1–7.
3. Fase 4 (US2) → **PARAR E VALIDAR** cenários 8–11 e 30.
4. Fase 5 (US3) → **PARAR E VALIDAR** cenário 14. O sistema já pode ser demonstrado.

### Entrega incremental

1. MVP (US1 + US2 + US3) → demonstração.
2. US4 (gerenciar) → validar → demonstração.
3. US5 (histórico e desfazer) → validar.
4. US6 (projetor) → validar.
5. Fase 9 → `validacao.md` completo (Etapa 6).

---

## Observações

- [P] = arquivos diferentes, sem dependências pendentes.
- [USn] liga a tarefa à história da spec para rastreabilidade.
- Marcar cada tarefa com `[X]` ao concluir (o `/speckit-implement` faz isso).
- Evitar: tarefas vagas, conflito no mesmo arquivo, dependências que quebrem a
  independência das histórias.
