# Guia rápido de validação: Sorteio de Alunos por Turma

Roteiro para subir o sistema e comprovar, com testes manuais, que a feature funciona de
ponta a ponta. É a base do `validacao.md` da Etapa 6 (cenário → esperado → obtido).
Detalhes de rotas e JSON: [contracts/rotas-http.md](contracts/rotas-http.md); regras de
dados: [data-model.md](data-model.md).

## Pré-requisitos

- Python do ambiente do projeto (`.venv/`, Django 6.1 instalado).
- Navegador atualizado (Chrome, Firefox ou Edge). Internet para carregar as bibliotecas
  de CDN (sem internet o sistema funciona, mas sem animações e fontes).
- Lista de 32 alunos em `docs/importacao-suap.md` (seção "Exemplo real para teste").

## Subir o sistema

```bash
.venv/bin/python manage.py migrate
.venv/bin/python manage.py check          # deve terminar sem erros
.venv/bin/python manage.py createsuperuser # opcional, para o /admin
.venv/bin/python manage.py runserver
```

Abrir `http://127.0.0.1:8000/`.

## Conferência rápida do importador (shell, sem banco)

```bash
.venv/bin/python manage.py shell
```

Colar o exemplo de 32 alunos em uma variável `texto` e chamar
`extrair_alunos(texto)` de `sorteio.turmas.importador`: devem sair 32 itens. Os demais
casos da tabela de [contracts/importador.md](contracts/importador.md) podem ser
conferidos do mesmo jeito.

## Cenários de validação

| # | Requisitos | Cenário | Resultado esperado |
|---|---|---|---|
| 1 | FR-001, FR-026 | Tela inicial sem turmas → "Nova turma" → nome "Teste" sem lista → confirmar | Turma criada; palco com "Sortear" desabilitado e sugestão de importar a lista |
| 2 | FR-006, FR-009, SC-001 | Nova turma "Informática 2A" → colar os 32 alunos | Prévia: 32 encontrados, 32 novos, 0 duplicados, nomes e matrículas iguais ao texto |
| 3 | FR-010 | Confirmar a importação do cenário 2 | 32 alunos em "Disponíveis"; contador 32 / 0 |
| 4 | FR-011, FR-014, SC-002 | Aba Alunos → "Colar mais uma lista" → mesma lista | Prévia: 32 encontrados, 0 novos, 32 duplicados (riscados); confirmar mantém 32 alunos |
| 5 | FR-007 | Colar "Maria da Silva" e "João Pereira" (uma por linha) | Prévia: 2 novos, sem matrícula |
| 6 | FR-010 | Colar só espaços / texto vazio | Aviso "Nenhum aluno encontrado"; nada salvo |
| 7 | FR-002 | Criar outra turma "informática 2a" (caixa diferente) e outra com nome vazio | Recusado nos dois casos, com mensagem no campo |
| 8 | FR-019..FR-021, SC-005 | Clicar em "Sortear" | Nomes giram, desaceleram e param em 3–6 s; nome em destaque, "1º sorteado", confete; item voa para "Já sorteados"; contadores 31 / 1 |
| 9 | FR-022, SC-003 | Sortear até acabar (32 vezes) | 32 nomes diferentes; ao final "Sortear" desabilitado e "Todos os alunos já foram sorteados. Reinicie o sorteio." |
| 10 | FR-022, FR-023, SC-007 | Em uma rodada com disponíveis, dar duplo clique rápido em "Sortear" (10 vezes) e abrir o Histórico | Cada duplo clique gera exatamente 1 registro |
| 11 | FR-022 | Palco aberto em duas abas; sortear alternando entre elas | Nenhum aluno repetido; ordens sem repetição |
| 12 | FR-030 | Clicar em "Desfazer último" | Último sorteado volta a "Disponíveis"; some do Histórico; próximo sorteio recebe a mesma ordem |
| 13 | FR-030 | Logo após reiniciar, olhar "Desfazer último" | Indisponível |
| 14 | FR-027, FR-031 | "Reiniciar sorteio" → cancelar; depois → confirmar | Cancelar: nada muda. Confirmar: todos disponíveis, "Rodada 2", histórico da rodada 1 mantido |
| 15 | FR-015, FR-016 | Com sorteio em andamento, adicionar "Aluno Novo" (sem matrícula) | Aparece em "Disponíveis" |
| 16 | FR-015 | Adicionar de novo "aluno novo" | Recusado: "Esse aluno já está na turma." |
| 17 | FR-017 | Remover um aluno já sorteado | Sai das listas; Histórico ainda mostra o nome |
| 18 | FR-018, FR-031 | "Limpar lista" → confirmar | Turma sem alunos, mas existente; Histórico mantido |
| 19 | FR-004, FR-031 | Excluir a turma "Teste" → confirmar | Some da tela inicial junto com alunos e histórico |
| 20 | FR-005, SC-008 | Duas turmas; sortear/reiniciar na A | Listas, contadores e histórico da B inalterados |
| 21 | FR-003 | Tela inicial após sortear 12 de 32 | Card mostra "32 alunos" e progresso "12 de 32" |
| 22 | FR-029 | Aba Histórico após 2 rodadas | Linha do tempo agrupada por rodada, com ordem e horário |
| 23 | FR-033, SC-006 | "Modo apresentação" no projetor | Tela cheia só com palco e botão; nome legível do fundo da sala (~8 m) |
| 24 | FR-034 | Teclas Espaço, F e Z no palco | Sorteia, alterna tela cheia, desfaz o último; ignoradas dentro de campos de texto |
| 25 | FR-035 | Ativar "reduzir movimento" no sistema operacional e sortear | Sem giro nem confete; nome aparece com transição suave |
| 26 | FR-036 | Leitor de tela (ou inspecionar a região `aria-live`) | Anuncia "Sorteado: NOME" |
| 27 | FR-037, SC-009 | DevTools → aba Rede, importar e sortear | Nenhuma requisição externa contém nome ou matrícula (só arquivos de CDN) |
| 28 | FR-032 | Qualquer ação (importar, remover, reiniciar…) | Toast em Português com o resultado |
| 29 | SC-004 | Cronometrar: copiar a lista do SUAP → primeiro sorteado | Menos de 1 minuto |
| 30 | Constituição II | Abrir `/sorteio/<id>/sortear/` direto na barra de endereço (GET) | 405, nada muda |

## Portões antes de concluir

1. `manage.py check` sem erros e migrations aplicadas.
2. Todos os cenários acima executados e registrados em `validacao.md` com o resultado
   obtido real.
3. `/impeccable audit` e `/impeccable polish` executados nas telas (se as skills
   estiverem instaladas).
