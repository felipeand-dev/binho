# Prompts do Spec Kit — Sorteio de Alunos

Use na ordem. Cada bloco é colado junto com o comando indicado.

> Antes do Prompt 3, instale as skills de front-end (ver `docs/skills-frontend.md`).

---

## Prompt 1 — `/speckit-constitution`

```
/speckit-constitution

Projeto: Sorteio de Alunos — sistema web para o professor do IF Baiano sortear
alunos da turma em sala de aula. A lista de alunos vem do SUAP por copiar e colar.

Crie os princípios para um projeto Python + Django focado em:

QUALIDADE DE CÓDIGO:
- Seguir PEP8 e as convenções do Django (CamelCase para models, snake_case para
  campos, funções e variáveis)
- Regra de negócio nos models (ou em módulos de serviço do app, como importador.py),
  nunca em templates nem em JavaScript
- Views enxutas, delegando a lógica para os models
- Toda alteração de schema versionada via migration
- Use exclusivamente Português do Brasil para todo o conteúdo do projeto
  (documentação, arquivos .md, requisitos, comentários, regras de negócio, mensagens
  da interface e saídas de comandos do Spec Kit). A única exceção é para nomes de
  tecnologias, ferramentas e comandos (ex: Python, Django, Git, GSAP, /speckit-plan),
  que não devem ser traduzidos. Esta regra é permanente e obrigatória para todas as
  etapas, atualizações e novos arquivos gerados.

ARQUITETURA:
- Padrão MVT do Django
- Apps separados por domínio dentro de sorteio/: turmas, alunos, sorteios
- Relacionamentos sempre explícitos via ForeignKey com related_name
- Ações que alteram dados somente via POST com CSRF
- Sem duplicação de regras entre Aluno e Sorteio

REGRAS DE NEGÓCIO (não podem ser violadas por nenhuma feature):
- Justiça do sorteio: quem escolhe o aluno sorteado é o servidor (módulo secrets do
  Python); o JavaScript apenas anima e para no nome já escolhido
- Sem repetição: um aluno sorteado não pode ser sorteado de novo até o professor
  reiniciar o sorteio da turma; a marcação deve ser atômica (dois cliques simultâneos
  nunca sorteiam o mesmo aluno duas vezes)
- Isolamento: cada turma tem sua própria lista, rodada e histórico
- Privacidade (LGPD): nomes e matrículas ficam só no banco local; é proibido enviá-los
  a serviços externos, inclusive APIs de IA. A importação do SUAP é feita por leitura
  de texto (expressão regular), sem IA

DESIGN:
- O visual deve parecer um produto profissional de alto nível, moderno e memorável,
  nada de aparência "padrão de template" ou "gerado por IA"
- Pensado para ser projetado na sala de aula: tipografia grande, alto contraste,
  modo tela cheia
- Animações fluidas e com propósito (feedback, orientação, suspense do sorteio),
  sempre respeitando prefers-reduced-motion
- Diretrizes visuais documentadas em docs/diretrizes-visuais.md

TESTES:
- Toda funcionalidade demonstrada tem um teste manual documentado
  (cenário → resultado esperado)
- Não fazer testes automatizados
```

---

## Prompt 2 — `/speckit-specify`

```
/speckit-specify

Funcionalidades do sistema

Turmas
O sistema deve permitir cadastrar, listar, renomear e excluir turmas.
O nome da turma deve ser obrigatório e único.
Cada turma deve ter sua própria lista de alunos, seu próprio sorteio e seu próprio histórico.

Alunos e importação do SUAP
O sistema deve permitir colar em um campo de texto a lista de alunos copiada do SUAP,
no formato: "Foto de" / nome do aluno / "Matrícula:" / número da matrícula
(exemplo completo em docs/importacao-suap.md).
O sistema deve aceitar também uma lista simples, com um nome por linha.
O sistema deve mostrar uma prévia antes de salvar: quantos alunos foram encontrados,
quantos são novos e quantos já existiam na turma.
O sistema não deve cadastrar o mesmo aluno duas vezes na mesma turma (mesma matrícula
ou, sem matrícula, mesmo nome ignorando acentos e maiúsculas).
O sistema deve permitir colar mais listas na mesma turma a qualquer momento.
O sistema deve permitir adicionar um aluno manualmente (nome obrigatório, matrícula opcional).
O sistema deve permitir remover um aluno e limpar a lista inteira da turma.

Sorteio
O sistema deve sortear um aluno entre os disponíveis da turma ao clicar em "Sortear".
Durante o sorteio, os nomes devem girar na tela, desacelerar e parar no aluno sorteado.
Um aluno já sorteado não pode ser sorteado novamente.
O sistema deve exibir separadamente os alunos "Disponíveis" e "Já sorteados", com contadores.
Quando todos os alunos já tiverem sido sorteados, o botão "Sortear" deve ficar
desabilitado e o sistema deve sugerir reiniciar o sorteio.
O sistema deve permitir reiniciar o sorteio, tornando todos os alunos disponíveis novamente.
O sistema deve registrar o histórico dos sorteios (aluno, ordem e horário).
O sistema deve permitir desfazer o último sorteio (quando o aluno sorteado estiver ausente).
Excluir turma, limpar lista e reiniciar sorteio devem pedir confirmação.
```

---

## Prompt 3 — `/speckit-plan`

```
/speckit-plan

STACK:
Python + Django
Banco de dados: SQLite (ambiente de desenvolvimento/demonstração)
Templates Django + CSS próprio + Bootstrap 5 via CDN (grid, modais e toasts), sem baixar recursos
Bootstrap Icons e fontes do Google Fonts via CDN — escolher um par tipográfico com
personalidade (fonte display marcante para títulos e para o nome sorteado + fonte de
texto legível); NÃO usar Inter, Roboto, Arial nem Space Grotesk
GSAP via CDN (jsDelivr) para as animações: gsap core + Flip + SplitText (todos gratuitos)
canvas-confetti via CDN para a celebração do sorteado
Um arquivo CSS próprio (sorteio/static/css/estilo.css) com design tokens em :root
(paleta, tipografia, espaçamentos, raios, sombras, curvas de easing e durações de
animação), para o visual não ter aparência padrão do Bootstrap
JavaScript sem framework, em módulos simples: static/js/app.js (interações gerais) e
static/js/roleta.js (animação do sorteio)
SQLite não deve ficar dentro do .gitignore
Registrar os models no /admin

SKILLS DE FRONT-END (instaladas no projeto — usar na criação das telas):
- frontend-design: definir uma direção estética própria antes de codar
- emil-design-eng / animate: toda animação precisa ter propósito, easing correto,
  poder ser interrompida e respeitar prefers-reduced-motion
- gsap-skills: usar GSAP do jeito correto (timelines, Flip, SplitText, performance)
- impeccable: usar /impeccable audit e /impeccable polish antes de finalizar

ARQUITETURA DE APPS (pastas já criadas):
config/            settings, urls, wsgi
sorteio/
├── turmas/        model Turma; CRUD; importador.py (leitura do texto do SUAP)
├── alunos/        model Aluno; adicionar, remover, limpar lista
├── sorteios/      model Sorteio (histórico); sortear, reiniciar, desfazer último
├── static/
│   ├── css/estilo.css
│   └── js/app.js, js/roleta.js
└── templates/
    ├── base.html   layout comum: cabeçalho, mensagens (toasts), modal de confirmação
    └── index.html  lista de turmas

MODELS PRINCIPAIS (campos em snake_case):
Turma: nome (único), descricao (opcional), rodada_atual (int, começa em 1), criada_em
Aluno: turma (FK → Turma, related_name='alunos'), nome, matricula (opcional, única por
turma), sorteado (bool), criado_em
Sorteio: turma (FK → Turma, related_name='sorteios'), aluno (FK → Aluno, SET_NULL,
related_name='sorteios'), nome_aluno (cópia do nome), rodada, ordem (1º, 2º...), data_hora

REGRAS:
- sortear(turma): escolhe com secrets.choice entre os alunos com sorteado=False;
  marca com UPDATE condicional (sorteado=False → True) dentro de transaction.atomic;
  cria o registro de Sorteio com a ordem na rodada
- reiniciar(turma): todos sorteado=False e rodada_atual + 1 (histórico mantido)
- desfazer_ultimo(turma): último Sorteio da rodada atual volta o aluno para disponível
- importador.extrair_alunos(texto): função pura (sem banco), trata \r\n, espaços extras,
  formato SUAP e lista simples; retorna nomes e matrículas sem duplicados
- A view de sortear responde JSON {id, nome, ordem, disponiveis, sorteados} para a animação

TELAS E DESIGN:
Seguir fielmente docs/diretrizes-visuais.md (conceito "Palco", paleta, fontes, wireframes
e a linha do tempo da animação do sorteio). Resumo:
Tela inicial (index):
- Cards das turmas com nome, total de alunos e progresso do sorteio (ex.: 12 de 32 sorteados)
- Botão de destaque "Nova turma"; estado vazio convidativo explicando o fluxo em 3 passos
- Entrada dos cards em cascata (stagger) e elevação suave no hover

Nova turma / importar lista:
- Campo grande para colar o texto do SUAP, com instrução visual de como copiar
- Prévia antes de salvar: lista dos alunos detectados (nome + matrícula), com
  contadores de encontrados / novos / duplicados e botão "Confirmar importação"

Tela do sorteio (a principal — precisa impressionar):
- Palco central grande onde os nomes giram (efeito letreiro/slot machine vertical),
  começando rápido e desacelerando com easing até parar no nome escolhido pelo servidor;
  duração total de 3 a 6 segundos
- O nome sorteado aparece enorme, com revelação letra a letra (SplitText), destaque de
  cor, confete e a ordem ("3º sorteado")
- O aluno "voa" da lista de Disponíveis para a lista de Já sorteados (GSAP Flip)
- Contadores animados de Disponíveis / Já sorteados
- Botão "Sortear" grande; atalho de teclado Espaço para sortear; botão fica desabilitado
  durante a animação e quando não houver disponíveis
- Botões "Reiniciar sorteio" (com modal de confirmação) e "Desfazer último"
- Botão "Modo apresentação" (tela cheia, fundo escuro, só o palco e o botão)
- Com prefers-reduced-motion: sem giro, apenas troca suave para o nome sorteado

Gerenciar alunos:
- Lista com busca, adicionar aluno (nome + matrícula opcional), remover (com
  confirmação) e "Limpar lista"

Padrões visuais:
- Status sempre em badges: disponível (verde) / já sorteado (cinza com ordem)
- Cards com bordas arredondadas e sombra suave, nada de tabelas cruas
- Confirmação (modal) antes de excluir, limpar ou reiniciar
- Mensagens do Django como toasts animados
- Estados vazios amigáveis com ícone e texto
- Layout responsivo (celular, notebook e projetor)
- Micro-interações em botões (pressionar, foco visível), transições de 150–300 ms

Ao terminar:
1. Mostre quais arquivos/specs foram feitos.
2. Resuma objetivamente o que foi feito em cada um.
3. Informe se encontrou algum ponto que ficou indefinido e precisa da minha decisão.
```

---

---

## Etapa 4 — `/speckit-tasks`

```
/speckit-tasks
```

Em seguida, conferir a coerência entre spec, plan e tasks (recomendado):

```
/speckit-analyze
```

---

## Etapa 5 — `/speckit-implement`

```
/speckit-implement

Implemente todas as tarefas do tasks.md, marcando cada uma com [X] ao concluir.
Siga a constituição, docs/regras-de-negocio.md, docs/importacao-suap.md e
docs/diretrizes-visuais.md. Use as skills frontend-design, emil-design-eng e gsap-skills
nas telas. Ao final, rode as migrations, confirme que `python manage.py check` passa e
me diga como iniciar o servidor.
```

Acabamento visual (opcional): `/impeccable audit` e depois `/impeccable polish`.

---

## Etapa 6 — Validação

```
Faça a validação do sistema conforme a constituição (testes manuais documentados).

1. Crie specs/001-.../validacao.md com uma tabela: Requisito (FR-xxx) | Cenário |
   Resultado esperado | Resultado obtido | OK?
   Inclua pelo menos um cenário para CADA requisito funcional da spec.md e os
   critérios de sucesso (SC-xxx), por exemplo:
   - importar a lista de docs/importacao-suap.md → 32 alunos encontrados;
   - colar a mesma lista de novo → 0 novos, 32 duplicados;
   - sortear 32 vezes numa turma de 32 → 32 nomes diferentes;
   - com todos sorteados → botão desabilitado e sugestão de reiniciar;
   - reiniciar → todos disponíveis, histórico mantido;
   - desfazer último → aluno volta para disponíveis;
   - duplo clique em Sortear → apenas um sorteio registrado.
2. Execute cada cenário no sistema rodando e preencha "Resultado obtido" com o que
   realmente aconteceu. Não marque OK sem ter executado.
3. Se algum cenário falhar, corrija o código e repita o teste.
4. No fim, informe quantos cenários passaram e se o sistema atende à spec.md.
```

Para a apresentação: tire um print de cada cenário e anexe ao `validacao.md`.
