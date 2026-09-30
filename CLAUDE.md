# Contexto para o assistente

- Projeto: sorteio de alunos (IF Baiano) em Django **sem banco de dados** (versão 2): estado na sessão em
  cookie assinado, sem login; publicado na Vercel. Tudo em Português do Brasil.
- Metodologia: Spec-Driven Development com Spec Kit. Siga `.specify/memory/constitution.md`.
- Specs: geradas pelos comandos /speckit-* (ver `docs/prompts-speckit.md`); rascunhos antigos em `docs/rascunhos/` apenas como referência.
- Regras de negócio: `docs/regras-de-negocio.md` (códigos RN-01..RN-14). Feature vigente: `specs/002-sorteio-rapido/`.
- Formato de entrada do SUAP e exemplo de 32 alunos: `docs/importacao-suap.md`.
- Interface: `docs/diretrizes-visuais.md` (aprovada pelo usuário — seguir fielmente).
- Etapa 6 (Validação) é obrigatória: `validacao.md` com cenário → esperado → obtido por requisito.
- Regras em `sorteio/sorteios/servico.py` e `importador.py` (nunca em templates/JS); design system em
  `sorteio/static/css/estilo.css`; JS progressivo.
- Ambiente: `.venv/` (use `.venv/bin/python`). Django 6.1 instalado.
- Não há testes automatizados (constituição); documente testes manuais.
