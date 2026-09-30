---
description: "Tarefas do Sorteio Rápido sem Cadastro (versão 2)"
---

# Tarefas: Sorteio Rápido sem Cadastro

**Entrada**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)

**Testes**: sem testes automatizados (constituição, Princípio V); cada história termina com
validação manual pelos cenários do [quickstart.md](quickstart.md).

**Regras para todas as tarefas**: regra de negócio só em `servico.py`/`importador.py`;
views enxutas; POST + CSRF com o campo `versao`; nada gravado no servidor; tudo em
Português do Brasil; reduzir movimento respeitado; `.venv/bin/python` nos comandos.

## Formato: `[ID] [P?] [História] Descrição`

---

## Fase 1: Preparação (remover a versão com banco)

- [X] T001 Remover os apps `sorteio/turmas/` e `sorteio/alunos/` inteiros, e de `sorteio/sorteios/` os arquivos `models.py`, `admin.py`, `migrations/` e `templates/sorteios/historico.html`; remover `sorteio/templates/index.html`, `sorteio/templates/partials/_abas_turma.html`, `sorteio/templates/partials/_estado_vazio.html` e `db.sqlite3` (backup da versão 1 em `/home/felipe/Documentos/Sorteio-backup-v1-turmas-2026-09-30.tar.gz`)
- [X] T002 Adicionar `whitenoise>=6.12,<7` a `requirements.txt` e instalar com `.venv/bin/pip install -r requirements.txt`
- [X] T003 Reescrever `config/settings.py`: `DATABASES = {}`; `INSTALLED_APPS` = `django.contrib.messages`, `django.contrib.staticfiles`, `sorteio`, `sorteio.sorteios`; `MIDDLEWARE` sem autenticação e com `whitenoise.middleware.WhiteNoiseMiddleware` logo após `SecurityMiddleware`; `SESSION_ENGINE = 'django.contrib.sessions.backends.signed_cookies'`, `SESSION_EXPIRE_AT_BROWSER_CLOSE = True`, `SESSION_COOKIE_HTTPONLY = True`, `SESSION_COOKIE_SAMESITE = 'Lax'`; `WHITENOISE_USE_FINDERS = True`; `STATIC_ROOT`; produção por variáveis (`DJANGO_DEBUG`, `DJANGO_SECRET_KEY` obrigatória com `DEBUG` desligado, `DJANGO_ALLOWED_HOSTS`, `DJANGO_CSRF_TRUSTED_ORIGINS`) e, com `DEBUG` desligado, `SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE`, `SECURE_PROXY_SSL_HEADER`; remover o context processor de autenticação
- [X] T004 Atualizar `config/urls.py` para só `path('', include('sorteio.sorteios.urls'))` e `config/wsgi.py` para expor também `app = application`
- [X] T005 Rodar `.venv/bin/python manage.py check` sem erros

---

## Fase 2: Fundação

- [X] T006 [P] Criar `sorteio/sorteios/importador.py` a partir do importador da versão 1, conforme [contracts/importador.md](contracts/importador.md): `PADRAO_SUAP`, `TAMANHO_MAXIMO_NOME = 150`, `normalizar_espacos`, `chave_nome`, `detectar_formato`, `extrair_nomes(texto) -> list[str]` (descarta matrículas e duplicados pela `chave_nome`); conferir no shell todas as linhas da tabela do contrato
- [X] T007 Criar `sorteio/sorteios/servico.py` com `SorteioDaSessao(sessao)` conforme [data-model.md](data-model.md): chave de sessão `sorteio` com `nomes`, `sorteados`, `rodada`, `versao`; `LIMITE_NOMES = 80`; `TAMANHO_MAXIMO_ESTADO = 3500` (bytes do estado serializado); propriedades `tem_lista`, `nomes`, `disponiveis` (lista de `(id, nome)`), `sorteados` (lista de `(ordem, id, nome)`), `rodada`, `versao`, `ultimo`; `_conferir_versao(versao)` levantando `RegraNegocioError('A lista mudou em outra aba. Recarregue a página.')`; `_salvar()` incrementando `versao` e marcando `sessao.modified = True`
- [X] T008 [P] Criar `sorteio/sorteios/forms.py` com `ListaForm` (`texto` `Textarea`, `max_length=100_000`, mensagem "O texto colado é grande demais.") e manter `sorteio/regras.py` e `sorteio/respostas.py`
- [X] T009 Atualizar `docs/regras-de-negocio.md` (regras RN-01 a RN-14 da versão 2) e `docs/diretrizes-visuais.md` (uma tela; campo de colar nomes; modal "Adicionar nomes"; sem turmas/abas/histórico), antes das mudanças visuais (constituição IV)
- [X] T010 Simplificar `sorteio/templates/base.html` (cabeçalho só com a marca; bloco para ações da lista) e remover estilos de telas extintas em `sorteio/static/css/estilo.css` (cartões de turma, importar de duas colunas, aba Alunos, histórico, renomear)

**Checkpoint**: `manage.py check` ok; serviço e importador conferidos no shell.

---

## Fase 3: História 1 — Colar os nomes e sortear (P1) 🎯 MVP

**Teste independente**: colar os 32 do SUAP, usar a lista, sortear; nome para em destaque
e vai para "Já sorteados" (31/1).

- [X] T011 [US1] Implementar em `sorteio/sorteios/servico.py` `previa(texto)` (encontrados, novos, já na lista, nomes, formato), `iniciar(texto)` (erros "Nenhum nome encontrado." e "A lista aceita até 80 nomes.") e `sortear(versao)` com `secrets.choice` (erro "Todos os alunos já foram sorteados. Reinicie o sorteio.")
- [X] T012 [US1] Implementar em `sorteio/sorteios/views.py` as views `palco` (GET), `previa` (POST, JSON), `iniciar` (POST) e `sortear` (POST, AJAX com o JSON do contrato) e as rotas em `sorteio/sorteios/urls.py` (`''`, `'previa/'`, `'lista/'`, `'sortear/'`)
- [X] T013 [US1] Criar `sorteio/sorteios/templates/sorteios/_colar_nomes.html` (textarea com `data-url-previa`, instrução "Como copiar do SUAP", prévia com contador e nomes via `_previa.html`) e reescrever `sorteio/sorteios/templates/sorteios/palco.html`: sem lista → palco com `_colar_nomes.html` e botão "Usar esta lista"; com lista → palco da versão 1 (Disponíveis, Já sorteados, Sortear) com `data-versao` e `input name="versao"` nos formulários
- [X] T014 [US1] Ajustar `sorteio/static/js/app.js` (prévia ao vivo com o novo JSON, só nomes) e `sorteio/static/js/roleta.js` (enviar `versao` em cada POST e atualizar `data-versao` e os campos `versao` com a resposta; recusa por versão → toast com botão para recarregar)
- [X] T015 [P] [US1] Estilizar em `sorteio/static/css/estilo.css` o estado "sem lista" do palco (campo de colar grande sobre o fundo escuro, prévia, botão "Usar esta lista")
- [X] T016 [US1] Validação manual: cenários 1 a 9, 22 e 25 do quickstart

---

## Fase 4: História 2 — Reiniciar e desfazer (P1)

- [X] T017 [US2] Implementar `desfazer(versao)` e `reiniciar(versao)` em `sorteio/sorteios/servico.py` (mensagens do data-model)
- [X] T018 [US2] Views e rotas `desfazer` (AJAX) e `reiniciar` em `sorteio/sorteios/views.py` e `sorteio/sorteios/urls.py`; botões no `palco.html` com `versao`, `data-requer-sorteados` e confirmação no reiniciar
- [X] T019 [US2] Validação manual: cenários 10 a 13

---

## Fase 5: História 3 — Mudar a lista durante a aula (P2)

- [X] T020 [US3] Implementar `adicionar(texto, versao)` e `limpar(versao)` em `sorteio/sorteios/servico.py`
- [X] T021 [US3] Views e rotas `adicionar` e `limpar`; no `palco.html`, botão "Adicionar nomes" abrindo um modal com `_colar_nomes.html` (prévia marcando "já na lista") e "Limpar lista" com `data-confirmar`
- [X] T022 [US3] Validação manual: cenários 14 e 15

---

## Fase 6: História 4 — Projetar para a turma (P3)

- [X] T023 [US4] Conferir em `palco.html`, `roleta.js` e `estilo.css` o modo apresentação, os atalhos (ignorados também dentro do modal e do campo de nomes) e a versão sem movimento
- [X] T024 [US4] Validação manual: cenários 19 a 21

---

## Fase 7: História 5 — Privacidade e acesso por link (P1)

- [X] T025 [US5] Criar `vercel.json` (builder `@vercel/python` em `config/wsgi.py`, rota `/(.*)`) e `.python-version` ou equivalente com Python 3.12
- [X] T026 [US5] Conferir que nenhum nome vai para disco, log ou terceiros (sem `print`/`logging` de nomes; `check --deploy` com `DEBUG` desligado) e que um cookie adulterado é descartado
- [X] T027 [US5] Validação manual: cenários 16 a 18, 23, 26 e 27

---

## Fase 8: Acabamento

- [X] T028 [P] Atualizar `README.md` (o que é, como rodar, como publicar na Vercel e no GitHub), `CLAUDE.md` (projeto sem banco), `config/README.md`, `sorteio/*/README.md` e `docs/importacao-suap.md` (onde fica o código; só nomes)
- [X] T029 Revisão de conformidade: nenhuma regra em template/JS; todas as ações com `@require_POST` e `versao`; PEP8 (linhas ≤ 99); textos em Português
- [X] T030 Revisão visual (desktop, projetor 1920×1080 e celular 375 px) e de acessibilidade (foco, contraste, `aria-live`)
- [X] T031 Executar todos os cenários do quickstart e registrar em `specs/002-sorteio-rapido/validacao.md` (Requisito | Cenário | Esperado | Obtido | OK?)

---

## Dependências

- Fase 1 → Fase 2 → histórias. US1 é a base da tela; US2, US3 e US4 dependem de T013/T014;
  US5 depende só da Fase 1–2 (configuração) e da US1 para validar.
- Tarefas no mesmo arquivo (`servico.py`, `views.py`, `palco.html`, `roleta.js`,
  `estilo.css`) são sequenciais.

## Paralelismo

- T006 e T008 juntos; T015 em paralelo com T011–T012; T028 em paralelo com T029.

## Estratégia

1. Fases 1–2 → US1 (MVP: colar e sortear) → validar.
2. US2 → US5 (publicável) → US3 → US4 → Acabamento e `validacao.md`.
