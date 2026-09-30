# Validação — Sorteio de Alunos por Turma

**Etapa 6 (constituição, Princípio V)** · Data: 2026-09-30 · Spec: [spec.md](spec.md) ·
Roteiro de cenários: [quickstart.md](quickstart.md)

## Como os testes foram executados

- Sistema rodando de verdade: `.venv/bin/python manage.py runserver` (Django 6.1.1, SQLite com
  `transaction_mode=IMMEDIATE`), banco zerado com `manage.py flush` antes da rodada final.
- Navegador real: Google Chrome (sem janela) controlado pelo Playwright, em 1366×900,
  1920×1080 (projetor) e 375×812 (celular). Cada cenário executa as ações na interface
  (colar, clicar, teclar, confirmar modais) e registra o **resultado obtido** lendo a tela,
  as respostas do servidor e o banco de dados. Nenhum item foi marcado sem ter sido executado.
- Os cenários 9 a 11 usam a tecla Esc para pular a animação e acelerar os 32 sorteios; o
  cenário 8 mede a animação completa.
- Resultado final: **33 de 33 cenários da interface ✅** e **2 de 2 testes de concorrência ✅**.
  Todos os 37 requisitos funcionais (FR-001 a FR-037) e os 9 critérios de sucesso
  (SC-001 a SC-009) têm ao menos um cenário.

## Resultados (cenário → esperado → obtido)

| # | Requisito | Cenário | Resultado esperado | Resultado obtido | OK? |
|---|---|---|---|---|---|
| 1 | FR-001, FR-026 | Nova turma "Teste" sem lista → Criar turma | Turma criada; "Sortear" desabilitado e sugestão de importar a lista | toast "Turma criada com 0 alunos."; estado=vazio; Sortear desabilitado=true; link "Colar a lista do SUAP" visível=true | ✅ |
| 2 | FR-006, FR-009, FR-013, SC-001 | Nova turma "Informática 2A" → colar os 32 alunos do SUAP | Prévia: 32 encontrados, 32 novos, 0 duplicados; nomes e matrículas iguais ao texto | prévia 32/32/0; 32 itens; iguais ao texto=true | ✅ |
| 3 | FR-010, FR-024 | Confirmar a importação do cenário 2 | 32 alunos em "Disponíveis"; contadores 32 / 0 | toast "Turma criada com 32 alunos."; 32 itens em Disponíveis; contadores 32/0 | ✅ |
| 4 | FR-011, FR-014, SC-002 | Aba Alunos → "Colar mais uma lista" → a mesma lista de 32 | Prévia 32 encontrados, 0 novos, 32 duplicados (riscados); a turma continua com 32 | prévia 32/0/32; 32 riscados; toast "0 alunos importados, 32 já estavam na turma."; alunos na turma=32 | ✅ |
| 5 | FR-007 | Colar "Maria da Silva" e "João Pereira" (um por linha) | Prévia: 2 novos, sem matrícula | 2 novos; matrículas exibidas=0; aviso "Lista simples: um aluno por linha, sem matrícula." | ✅ |
| 6 | FR-010 | Colar só espaços e tentar confirmar | Aviso "Nenhum aluno encontrado"; nada salvo | prévia: "A prévia aparece aqui assim que você colar a lista."; ao confirmar: toast "Nenhum aluno encontrado. Cole a lista antes de confirmar."; alunos na turma=0 | ✅ |
| 7 | FR-002 | Criar turma "informática 2a" (caixa diferente) e outra com nome vazio | Recusado nos dois casos, com mensagem no campo | duplicado: "Já existe uma turma com esse nome."; vazio: "Informe o nome da turma."; turmas no banco=2 | ✅ |
| 8 | FR-019, FR-020, FR-021, FR-024, SC-005 | Clicar em "Sortear" | Nomes giram, desaceleram e param em 3–6 s; nome em destaque, "1º sorteado", confete; item vai para "Já sorteados"; contadores 31/1 | fita girando (quadros diferentes=true); parou em 4.06 s; revelado "SABRINA COELHO VIANA" (1º sorteado); servidor escolheu "SABRINA COELHO VIANA" → igual=true; canvas de confete=1; contadores 31/1 | ✅ |
| 9 | FR-022, FR-025, SC-003 | Sortear até acabar (32 sorteios; os 31 últimos pulando a animação com Esc) | 32 nomes diferentes; ao final "Sortear" desabilitado e "Todos os alunos já foram sorteados. Reinicie o sorteio."; 33º sorteio recusado | 32 sorteios, 32 alunos distintos, ordens 1..32=true; Sortear desabilitado=true; mensagem visível=true; "Turma completa!" visível=true; 33º POST → 409 "Todos os alunos já foram sorteados. Reinicie o sorteio." | ✅ |
| 10 | FR-022, FR-023, SC-007 | Duplo clique rápido em "Sortear" (10 vezes) | Cada duplo clique gera exatamente 1 registro | registros criados por tentativa: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1] (antes=32) | ✅ |
| 11 | FR-022 | Palco aberto em duas abas; sortear alternando entre elas (6 sorteios) | Nenhum aluno repetido; ordens sem repetição | rodada 2: 16 sorteios, 16 alunos distintos, 16 ordens distintas; erros JS na 2ª aba=0 | ✅ |
| 12 | FR-030 | Clicar em "Desfazer último" | Último sorteado volta a "Disponíveis"; some do histórico; próximo sorteio recebe a mesma ordem | desfeito "Beatriz Almeida Fontes" (16º); voltou a Disponíveis=true; registros dele na rodada=0; toast "Desfeito: Beatriz Almeida Fontes voltou para os disponíveis."; próximo sorteio recebeu ordem 16º | ✅ |
| 13 | FR-030 | Logo após reiniciar, olhar "Desfazer último" | Indisponível | botão desabilitado=true | ✅ |
| 14 | FR-027, FR-031 | "Reiniciar sorteio" → cancelar; depois → confirmar | Cancelar: nada muda. Confirmar: todos disponíveis, "Rodada 2", histórico da rodada 1 mantido | cancelar: rodada=1, disponíveis=0 (sem mudança=true); confirmar: toast "Sorteio reiniciado. Rodada 2.", contadores 32/0, selo "Rodada 2", registros da rodada 1=32 | ✅ |
| 15 | FR-015, FR-016 | Com sorteio em andamento (rodada 2), adicionar "Aluno Novo" sem matrícula | Aparece em "Disponíveis" | toast "Aluno adicionado: Aluno Novo."; em Disponíveis=true | ✅ |
| 16 | FR-011, FR-015 | Adicionar de novo "aluno  novo" | Recusado: "Esse aluno já está na turma." | toast "Esse aluno já está na turma."; cadastros "Aluno Novo"=1 | ✅ |
| 17 | FR-017 | Remover um aluno já sorteado (com confirmação) | Sai das listas; o histórico ainda mostra o nome | toast "Aluno removido: PAULA REGINA DUARTE."; ainda nas listas do palco=false; no histórico: "1º PAULA REGINA DUARTE removido da turma 14:18 / 3º PAULA REGINA DUARTE removido da turma 14:17" | ✅ |
| 18 | FR-018, FR-031 | "Limpar lista" → confirmar | Turma sem alunos, mas existente; histórico mantido | toast "Lista limpa. A turma continua cadastrada."; turma existe=true; alunos=0; histórico 50→50 | ✅ |
| 19 | FR-001, FR-004, FR-031 | Excluir a turma "Teste" → cancelar; depois → confirmar | Cancelar: continua. Confirmar: some da tela inicial junto com alunos e histórico | após cancelar existe=true; após confirmar: toast "Turma "Teste" excluída.", na tela inicial=false, no banco=false | ✅ |
| 19b | FR-001, FR-002 | Renomear "Redes 1B" para "Redes 1º B"; depois tentar "INFORMÁTICA 2A" | Renomeia; o nome repetido é recusado | título "Redes 1º B", toast "Turma renomeada."; nome repetido: toast "Já existe uma turma com esse nome." | ✅ |
| 20 | FR-005, FR-012, SC-008 | Turma B ("Redes 1B", mesma lista e mesmas matrículas) com 1 sorteado; na turma A: sortear, reiniciar e sortear | Listas, contadores, rodada e histórico da B inalterados; mesma matrícula aceita nas duas turmas | B antes=[1,32,1,1,[57]] depois=[1,32,1,1,[57]] ([rodada, alunos, sorteados, histórico, ids sorteados]); B tem 32 alunos com as mesmas matrículas da A | ✅ |
| 21 | FR-003 | Tela inicial com a turma em andamento | Cartão mostra total de alunos e progresso "X de N" | cartão: "Informática 2A Alunos 32 Sorteados nesta rodada 15 de 32 Sortear"; banco: 32 alunos, 15 sorteados | ✅ |
| 22 | FR-028, FR-029 | Aba Histórico após 2 rodadas | Linha do tempo agrupada por rodada, com ordem e horário | grupos: "Rodada 2 Hoje, 14:18 · 16 sorteados rodada atual" ; "Rodada 1 Hoje, 14:17 · 32 sorteados"; itens por rodada=[16,32] | ✅ |
| 23 | FR-033, SC-006 | "Modo apresentação" em 1920×1080 (projeção estimada de 2 m de largura) | Só palco e botão visíveis; nome legível do fundo da sala (~8 m, regra: altura ≥ distância/200 = 4 cm) | tela cheia do navegador=true; listas=none, cabeçalho=none, botão=inline-block; nome com 170 px ≈ 12.4 cm de maiúscula projetada (cálculo; não verificado presencialmente) | ✅ |
| 24 | FR-034 | Teclas Espaço, F e Z no palco; Z e Espaço digitados dentro do campo "Renomear" | Sorteia, alterna tela cheia, desfaz o último; ignoradas dentro de campos de texto | Espaço: 50→51; F ligou modo apresentação=true e desligou=true; Z: 51→50; dentro do campo: 50→50 | ✅ |
| 25 | FR-035, SC-005 | Navegador com "reduzir movimento" e sortear | Sem giro nem confete; nome aparece com transição suave (menos de 1 s) | giro exibido=false; linhas da fita=0; confete (canvas)=0; nome "FERNANDO QUEIROZ MOTA" em 0.13 s | ✅ |
| 26 | FR-036 | Região aria-live após o sorteio | Anuncia "Sorteado: NOME" | aria-live="Sorteado: SABRINA COELHO VIANA" | ✅ |
| 27 | FR-008, FR-037, SC-009 | Monitorar todas as requisições externas do navegador durante o roteiro inteiro | Nenhuma requisição externa contém nome ou matrícula (só arquivos de CDN) | 465 requisições externas, hosts: fonts.googleapis.com, cdn.jsdelivr.net, fonts.gstatic.com, ; métodos diferentes de GET=0; com nome/matrícula=0 | ✅ |
| 28 | FR-032 | Ações que alteram dados ao longo do roteiro (criar, importar, adicionar, remover, desfazer, reiniciar, limpar, excluir, renomear) | Toast em Português com o resultado | 13 toasts conferidos, todos em Português (ex.: toast "Turma criada com 0 alunos.", toast "Turma criada com 32 alunos.", toast "0 alunos importados, 32 já estavam na turma.") | ✅ |
| 28b | FR-028 | Campos do registro de histórico (banco) | Nome do aluno, rodada, ordem e data/hora | nome_aluno preenchido=true, rodada=2, ordem=1, data/hora=true | ✅ |
| 29 | SC-004 | Do início da colagem da lista até o 1º sorteado (fluxo automatizado) | Menos de 1 minuto | 7.8 s (automatizado; tempo humano não cronometrado) | ✅ |
| 30 | Constituição II | Abrir /sorteio/<id>/sortear/ direto na barra de endereço (GET) | 405, nada muda | status 405; sorteios 50→50 | ✅ |
| JS | — | Erros de JavaScript durante todo o roteiro | Nenhum erro de script | nenhum erro de script; 1 registro(s) de rede "409" no console, gerados pelas recusas esperadas (33º sorteio forçado) | ✅ |

## Testes de concorrência (RN-15, FR-022, SC-007)

Executados direto no servidor, com 10 requisições POST `/sortear/` liberadas ao mesmo tempo
por uma barreira de threads (cookie e token CSRF válidos).

| # | Requisito | Cenário | Resultado esperado | Resultado obtido | OK? |
|---|---|---|---|---|---|
| C1 | RN-15, FR-022, SC-007 | Turma com 32 alunos; 3 rajadas de 10 sorteios simultâneos | 30 sorteios, 30 alunos diferentes, ordens 1..30 sem repetição, nenhum erro | 30 respostas 200; 30 alunos distintos; ordens 1 a 30; no banco: 30 registros, 30 alunos distintos, 30 marcados como sorteados | ✅ |
| C2 | RN-15, RN-17 | Rajada de 10 sorteios simultâneos restando só 2 alunos | 2 sorteios aceitos, 8 recusados; nenhum aluno repetido | 2 respostas 200 (ordens 31 e 32) e 8 respostas 409; banco com 32 registros e 32 alunos distintos | ✅ |

## Defeitos encontrados e corrigidos durante a validação

| Defeito | Onde apareceu | Correção | Reteste |
|---|---|---|---|
| Mensagem "Informe o nome da turma." aparecia duas vezes com nome em branco (validação do formulário + `clean()` do model) | Cenário 7 | `Turma.clean_fields` normaliza o nome e a mensagem de campo em branco foi para o próprio campo; `clean()` só verifica a unicidade | Cenário 7 ✅ (uma mensagem) |
| **RN-01 violada com acentos:** renomear para "INFORMÁTICA 2A" era aceito existindo "Informática 2A" (no SQLite, `iexact` e `LOWER()` só ignoram maiúsculas em letras ASCII) | Cenário 19b | Novo campo `Turma.chave` (nome com `casefold()` e espaços normalizados) com restrição `unique` no banco; migrations 0004/0005, que também resolvem duplicatas antigas acrescentando " (2)" | Cenário 19b ✅ |

Também foram ajustados na implementação, antes desta rodada: ordem alfabética sem
diferenciar maiúsculas (`Lower('nome')`) e o botão "Sortear" mantido dourado até o fim da
revelação.

## Limitações declaradas

- **SC-006 (legível a ~8 m):** verificado por cálculo, não presencialmente. Em 1920×1080 o
  nome no modo apresentação tem 170 px; numa projeção de 2 m de largura, as maiúsculas
  ficam com cerca de 12 cm, três vezes o mínimo de 4 cm da regra "altura ≥ distância/200".
  Recomenda-se conferir na sala antes da apresentação.
- **SC-004 (menos de 1 minuto):** o fluxo automatizado levou 7,8 s da colagem ao primeiro
  sorteado; o tempo de uma pessoa usando o sistema não foi cronometrado.
- **Leitor de tela (FR-036):** verificada a região `aria-live` com o texto "Sorteado: NOME";
  não foi testado com um leitor de tela real (NVDA/Orca).
- **Sem internet:** as bibliotecas vêm de CDN; o comportamento sem internet não fez parte
  desta rodada (ver ponto 3 do plan.md).

## Capturas

As capturas desta rodada mostravam nomes reais de alunos e foram retiradas do repositório
antes da publicação (LGPD, constituição III). Elas estão no backup local da versão 1
(`Sorteio-backup-v1-turmas-2026-09-30.tar.gz`). Pelo mesmo motivo, os nomes citados nesta
tabela foram substituídos pelos nomes fictícios correspondentes de `docs/importacao-suap.md`.

## Conclusão

Todos os 35 testes passaram (33 cenários da interface e 2 de concorrência), cobrindo os
37 requisitos funcionais e os 9 critérios de sucesso. Com as duas correções acima, o
sistema atende à [spec.md](spec.md), exceto pelo que depende de verificação presencial
(legibilidade no projetor e leitor de tela real), listado nas limitações.
