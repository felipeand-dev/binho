# Sorteio de Alunos — Constituição

## Core Principles

### Idioma
TODO o conteúdo do projeto — documentação, arquivos `.md`, requisitos, comentários,
regras de negócio, mensagens da interface e saídas dos comandos do Spec Kit — deve
estar em Português do Brasil. Exceção apenas para nomes de tecnologias, ferramentas
e comandos (ex.: Python, Django, Git, /speckit-plan).

### Qualidade de Código
Seguir PEP8 e as convenções do Django (Models em CamelCase; funções e variáveis em
snake_case). Regra de negócio fica nos `models` (ou em módulos de serviço do app,
como `importador.py`), nunca em templates nem em JavaScript. Views devem ser enxutas.
Toda alteração de esquema deve ser versionada por migrações do Django.

### Arquitetura
Padrão MVT do Django, organizado em apps por domínio: `turmas`, `alunos`, `sorteios`.
Relacionamentos explícitos por `ForeignKey` com `related_name` definido.
Ações que alteram dados usam somente POST com proteção CSRF.

### Justiça do Sorteio (Não negociável)
- A escolha do aluno sorteado é feita **no servidor**, com o módulo `secrets` do Python.
- O JavaScript apenas **encena** a animação e para no nome já escolhido pelo servidor.
- Um aluno sorteado não pode ser sorteado de novo até o professor reiniciar o sorteio.
- A marcação de "sorteado" deve ser atômica: dois cliques simultâneos nunca podem
  sortear o mesmo aluno duas vezes.

### Privacidade (LGPD)
Os dados dos alunos (nome e matrícula) ficam apenas no banco local do sistema.
É proibido enviá-los a serviços externos (APIs de IA, analytics etc.). A importação
da lista do SUAP é feita por leitura de texto (expressão regular), sem IA.

### Design
A interface deve ser profissional, moderna e interativa, pensada para ser exibida
em **projetor** na sala de aula: fontes grandes, alto contraste, modo tela cheia.
Animações devem respeitar `prefers-reduced-motion`. As diretrizes visuais ficam
documentadas em `docs/diretrizes-visuais.md`.

### Testes
Toda funcionalidade precisa de um teste manual documentado (cenário → resultado
esperado). Não serão usados testes automatizados como prática padrão; qualquer
exceção precisa de aprovação formal.

## Additional Constraints
- Banco de dados: SQLite (projeto de demonstração/sala de aula).
- Sem autenticação nesta primeira versão (uso individual pelo professor).

## Governance
Esta constituição tem precedência sobre práticas não alinhadas com seus princípios.
Emendas exigem justificativa em Português.

**Version**: 1.0.0 | **Ratified**: 2026-09-30 | **Last Amended**: 2026-09-30
