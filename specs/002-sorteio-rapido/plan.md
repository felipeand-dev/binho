# Plano de Implementação: Sorteio Rápido sem Cadastro

**Branch**: `002-sorteio-rapido` | **Data**: 2026-09-30 | **Spec**: [spec.md](spec.md)

**Entrada**: especificação em `specs/002-sorteio-rapido/spec.md` (substitui a feature 001,
conforme a constituição 2.0.0)

## Resumo

Transformar o sistema numa ferramenta de sorteio de uma tela só, sem banco e sem login,
publicável na Vercel. O professor cola os nomes (SUAP ou um por linha); o estado do sorteio
fica na sessão do Django em **cookie assinado**, que expira ao fechar o navegador. O
servidor continua escolhendo com `secrets` e recusando ações sobre um estado antigo
(campo `versao`); o palco, a roleta GSAP, o confete, o modo apresentação e os atalhos da
versão 1 são reaproveitados. Saem os apps `turmas` e `alunos`, os models e as migrations.
Decisões em [research.md](research.md).

## Contexto Técnico

**Linguagem/Versão**: Python 3 do `.venv/` com Django 6.1.1

**Dependências principais**: Django; WhiteNoise 6.12 (estáticos em produção). Front-end via
CDN sem build: Bootstrap 5.3, Bootstrap Icons, Google Fonts, GSAP 3.13 (Flip, SplitText),
canvas-confetti 1.9

**Armazenamento**: nenhum no servidor. Sessão em cookie assinado
(`signed_cookies`, `SESSION_EXPIRE_AT_BROWSER_CLOSE`); `DATABASES = {}`

**Testes**: somente testes manuais documentados ([quickstart.md](quickstart.md) →
`validacao.md`); sem testes automatizados

**Plataforma-alvo**: navegador moderno (projetor, notebook, celular); servidor: `runserver`
local e Vercel (função Python serverless)

**Tipo de projeto**: aplicação web Django de uma tela, renderizada no servidor com JS
progressivo

**Metas de desempenho**: resposta de `/sortear/` < 200 ms local; animação 60 fps; sorteio
em 3–6 s (SC-004)

**Restrições**: cookie de sessão < 3.500 bytes (80 nomes ≈ 1,4 KB medidos); até 80 nomes;
nenhum nome em disco, log ou serviço externo; regra só em Python; POST + CSRF; tudo em
Português do Brasil

**Escala/Escopo**: um professor por navegador; 1 tela + modais

## Verificação da Constituição (2.0.0)

*PORTÃO: antes da Fase 0 e depois da Fase 1.*

| Princípio | Exigência | Como o plano atende | Situação |
|---|---|---|---|
| I | PEP8; regra em módulo de serviço, nunca em template/JS | `servico.py` (`SorteioDaSessao`) e `importador.py`; prévia ao vivo chama o servidor | ✅ |
| I | Views enxutas | views chamam 1 método do serviço e usam `responder()` | ✅ |
| I | Português do Brasil | código, mensagens, docs | ✅ |
| II | MVT sem banco; estado em cookie assinado que expira ao fechar | `signed_cookies` + `SESSION_EXPIRE_AT_BROWSER_CLOSE`; `DATABASES = {}` | ✅ |
| II | `DJANGO_SECRET_KEY` por variável de ambiente em produção | `settings.py` exige a variável quando `DEBUG` está desligado | ✅ |
| II | POST + CSRF | todas as ações com `@require_POST`; JS envia `X-CSRFToken` | ✅ |
| III | Justiça com `secrets`; JS só anima | `SorteioDaSessao.sortear` + `roleta.js` reaproveitado | ✅ |
| III | Sem repetição; versão; botão travado | campo `versao` verificado em todas as ações (research §2) | ✅ ⚠ risco residual documentado |
| III | Cada navegador, sua lista | estado só no cookie do próprio navegador | ✅ |
| III | LGPD: só nomes, nada no servidor, sem IA | matrícula descartada no importador; sem banco/arquivos/logs com nomes | ✅ |
| IV | Design de palco, reduzir movimento, diretrizes | reaproveita estilo e roleta; `docs/diretrizes-visuais.md` atualizado primeiro | ✅ |
| V | Testes manuais, sem automatizados | 27 cenários no quickstart → `validacao.md` | ✅ |

**Resultado**: aprovado antes e depois da Fase 1; o risco residual de requisições
simultâneas forjadas está registrado em research §2 (não viola a regra pela interface).

## Estrutura do Projeto

### Documentação

```text
specs/002-sorteio-rapido/
├── spec.md, plan.md, research.md, data-model.md, quickstart.md
├── contracts/rotas-http.md, contracts/importador.md
├── checklists/requirements.md
└── tasks.md            # /speckit-tasks
```

### Código-fonte

```text
manage.py
requirements.txt              # Django + whitenoise
vercel.json                   # builder @vercel/python → config/wsgi.py
config/
├── settings.py               # sem banco, sessão em cookie, WhiteNoise, produção por env
├── urls.py                   # só include('sorteio.sorteios.urls')
└── wsgi.py                   # expõe `app` para a Vercel
sorteio/
├── apps.py, regras.py, respostas.py
├── sorteios/
│   ├── apps.py, urls.py, views.py
│   ├── importador.py         # extrair_nomes, detectar_formato, chave_nome
│   ├── servico.py            # SorteioDaSessao (estado, versão, regras)
│   ├── forms.py              # ListaForm (texto)
│   └── templates/sorteios/
│       ├── palco.html        # a tela única
│       ├── _colar_nomes.html # campo + prévia (tela inicial e modal)
│       └── _previa.html
├── templates/
│   ├── base.html             # cabeçalho simplificado, toasts, modais
│   └── partials/_toasts.html, _modal_confirmacao.html
└── static/css/estilo.css, js/app.js, js/roleta.js
REMOVIDOS: sorteio/turmas/, sorteio/alunos/, sorteio/sorteios/models.py, admin.py,
           migrations/, templates index.html, historico.html, _abas_turma.html,
           _estado_vazio.html, db.sqlite3
```

**Decisão de estrutura**: um app de domínio (`sorteios`) basta para uma tela; o app
`sorteio` continua com templates, estáticos e utilitários globais.

## Acompanhamento de Complexidade

| Violação | Por que é necessária | Alternativa mais simples rejeitada porque |
|---|---|---|
| Nova dependência (WhiteNoise) | a Vercel não serve `/static/` de um app Django sozinha | copiar estáticos para outra pasta pública exigiria passo de build extra e duplicação |
