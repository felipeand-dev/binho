# Sorteio de Alunos — Constituição

## Princípios Fundamentais

### I. Qualidade de Código e Idioma

- O código Python DEVE seguir a PEP8 e as convenções do Django: classes em CamelCase;
  funções, métodos e variáveis em snake_case.
- A regra de negócio DEVE ficar em módulos de serviço do app (ex.: `importador.py` para
  ler a lista colada e um módulo de serviço para o sorteio). É PROIBIDO implementar
  regra de negócio em templates ou em JavaScript.
- As views DEVEM ser enxutas: recebem a requisição, validam o formulário, chamam o
  serviço e devolvem a resposta. Nenhuma decisão de negócio na view.
- Todo o conteúdo do projeto DEVE estar exclusivamente em Português do Brasil:
  documentação, arquivos `.md`, requisitos, comentários, docstrings, regras de
  negócio, mensagens da interface, mensagens de erro e saídas dos comandos do Spec Kit.
  A única exceção são nomes de tecnologias, ferramentas e comandos (ex.: Python, Django,
  Git, GSAP, Vercel, `/speckit-plan`), que não são traduzidos. Esta regra é permanente
  e vale para todas as etapas, atualizações e novos arquivos gerados.

**Justificativa**: convenções uniformes e regras concentradas em um serviço em Python
tornam o código previsível, fácil de avaliar e impedem que a mesma regra seja
reimplementada (e divergir) em várias camadas. O idioma único atende ao IF Baiano.

### II. Arquitetura MVT sem Banco de Dados

- O projeto DEVE seguir o padrão MVT do Django (views + templates), sem models de
  domínio e sem banco de dados. Nada do sorteio é gravado no servidor.
- O estado do sorteio (lista de nomes, quem já saiu, rodada) DEVE viver na sessão do
  Django guardada em **cookie assinado** no navegador do professor, e DEVE expirar ao
  fechar o navegador. O servidor não guarda estado entre requisições.
- A assinatura do cookie DEVE impedir que o estado seja alterado fora do sistema; a
  chave secreta (`DJANGO_SECRET_KEY`) DEVE vir de variável de ambiente em produção.
- Toda ação que altera o estado (usar lista, adicionar nomes, sortear, desfazer,
  reiniciar, limpar) DEVE ocorrer somente via POST com proteção CSRF. Requisições GET
  NUNCA alteram o estado.
- Cada regra tem um único dono: a leitura da lista fica no importador e as operações do
  sorteio ficam no serviço; views e JavaScript apenas os usam.

**Justificativa**: sem banco, o sistema pode ser hospedado de graça em plataformas sem
disco persistente (Vercel), não precisa de login e não acumula dados de alunos.

### III. Regras de Negócio Invioláveis (INEGOCIÁVEL)

Nenhuma feature, otimização ou ajuste visual PODE violar as regras abaixo. Os detalhes
ficam na spec vigente em `specs/` e em `docs/regras-de-negocio.md`.

- **Justiça do sorteio**: o nome sorteado DEVE ser escolhido pelo servidor com o
  módulo `secrets` do Python. O JavaScript apenas anima e para no nome já escolhido;
  ele NUNCA escolhe, filtra ou influencia o resultado.
- **Sem repetição**: um nome sorteado NÃO PODE sair de novo até o professor reiniciar o
  sorteio. Cada ação de sorteio DEVE informar a versão do estado que a tela conhece e o
  servidor DEVE recusar ações feitas sobre uma versão antiga; a interface DEVE impedir
  cliques repetidos enquanto um sorteio está em andamento.
- **Cada navegador, sua lista**: o estado de um navegador NUNCA é visto nem alterado por
  outro visitante do site.
- **Privacidade (LGPD)**: apenas nomes são usados; a matrícula presente na lista do SUAP
  DEVE ser descartada na leitura. Nenhum nome é gravado no servidor (banco, arquivo ou
  log) nem enviado a serviços externos, inclusive APIs de IA ou analytics. A leitura da
  lista DEVE ser feita por expressão regular, sem IA (ver `docs/importacao-suap.md`).

**Justificativa**: a confiança da turma depende de um sorteio justo, imprevisível e sem
repetições; nomes de alunos (muitos menores de idade) são dados pessoais protegidos por lei.

### IV. Design de Palco para Sala de Aula

- O visual DEVE parecer um produto profissional de alto nível, moderno e memorável.
  É PROIBIDA a aparência de "template padrão" (ex.: Bootstrap sem personalização) ou
  de interface "gerada por IA".
- A interface DEVE ser pensada para projeção em sala de aula: tipografia grande,
  alto contraste e modo tela cheia na tela de sorteio.
- As animações DEVEM ser fluidas e ter propósito (feedback, orientação ou suspense do
  sorteio) e DEVEM respeitar `prefers-reduced-motion`, oferecendo uma alternativa sem
  movimento que exiba o mesmo resultado.
- As diretrizes visuais (cores, tipografia, formas, animações) estão em
  `docs/diretrizes-visuais.md`, aprovado pelo usuário, e DEVEM ser seguidas fielmente.
  Mudanças visuais relevantes exigem atualizar esse documento primeiro.

**Justificativa**: o sorteio é um momento coletivo, visto de longe no projetor; a
experiência precisa prender a atenção sem excluir quem é sensível a movimento.

### V. Testes Manuais Documentados

- Toda funcionalidade demonstrada DEVE ter um teste manual documentado no formato
  cenário → resultado esperado → resultado obtido.
- A validação final (Etapa 6) DEVE produzir `specs/<feature>/validacao.md` com pelo
  menos um cenário para cada requisito funcional (FR-xxx) e critério de sucesso (SC-xxx).
- Nenhum cenário PODE ser marcado como aprovado sem ter sido executado no sistema.
- Este projeto NÃO utiliza testes automatizados: nenhuma tarefa, arquivo ou dependência
  de testes automatizados deve ser criada.

**Justificativa**: o projeto é avaliado pela demonstração em sala; testes manuais
rastreáveis aos requisitos comprovam o comportamento de forma direta e verificável.

## Restrições de Tecnologia e Privacidade

- Stack: Python + Django (versão do `.venv/`), sem banco de dados. Use sempre
  `.venv/bin/python` para executar comandos do projeto. Dependências Python DEVEM se
  limitar ao Django e ao estritamente necessário para servir o site em produção.
- Front-end: templates Django, CSS próprio com design tokens em
  `sorteio/static/css/estilo.css` e JavaScript progressivo sem framework. As páginas
  DEVEM continuar utilizáveis se uma animação falhar.
- Bibliotecas e fontes via CDN (Bootstrap, Bootstrap Icons, Google Fonts, GSAP,
  canvas-confetti) são permitidas apenas para baixar recursos estáticos; nenhuma
  requisição a serviço externo PODE conter nome de aluno.
- Hospedagem: código no GitHub e site na Vercel. Em produção, `DEBUG` DEVE estar
  desligado e `DJANGO_SECRET_KEY` DEVE ser definida como variável de ambiente.

## Fluxo de Desenvolvimento e Portões de Qualidade

- Metodologia: Spec-Driven Development com Spec Kit, na ordem
  `/speckit-specify` → `/speckit-clarify` (opcional) → `/speckit-plan` →
  `/speckit-tasks` → `/speckit-analyze` (recomendado) → `/speckit-implement` →
  Validação (Etapa 6, obrigatória). Prompts de referência em `docs/prompts-speckit.md`.
- O `plan.md` DEVE conter a verificação de conformidade com esta constituição
  ("Constitution Check"); qualquer desvio DEVE ser justificado na tabela de complexidade.
- Portões antes de considerar uma feature concluída:
  1. `python manage.py check` sem erros (também com `DEBUG` desligado);
  2. nenhuma regra de negócio em template ou JavaScript;
  3. toda ação que altera o estado via POST com CSRF;
  4. nenhum nome gravado no servidor nem enviado a terceiros;
  5. `validacao.md` preenchido com resultados obtidos reais;
  6. textos, comentários e documentação em Português do Brasil.
- Rascunhos em `docs/rascunhos/` e a feature `specs/001-sorteio-alunos/` (versão com
  turmas e banco) servem apenas como histórico e referência.

## Governança

- Esta constituição prevalece sobre qualquer outra prática, spec, plano ou tarefa do
  projeto. Em caso de conflito, a constituição vence e o artefato conflitante DEVE ser
  corrigido.
- Emendas são feitas somente pelo comando `/speckit-constitution`, com aprovação do
  usuário (responsável pelo projeto), registrando o Relatório de Impacto no topo deste
  arquivo e revisando os artefatos afetados em `specs/`.
- Versionamento semântico:
  - MAJOR: remoção ou redefinição incompatível de um princípio ou regra inviolável;
  - MINOR: novo princípio ou seção, ou ampliação material de uma orientação;
  - PATCH: esclarecimentos, redação e correções sem mudança de sentido.
- Revisão de conformidade: `/speckit-plan` (Constitution Check), `/speckit-analyze` e
  a Etapa 6 (Validação) DEVEM verificar a aderência a estes princípios. Violações do
  Princípio III bloqueiam a entrega até serem corrigidas.
- Orientação de execução para o assistente: `CLAUDE.md` na raiz do projeto.

**Versão**: 2.0.0 | **Ratificada em**: 2026-09-30 | **Última emenda**: 2026-09-30
