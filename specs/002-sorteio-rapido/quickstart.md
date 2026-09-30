# Guia rápido de validação: Sorteio Rápido sem Cadastro

Base do `validacao.md` (Etapa 6). Rotas e JSON: [contracts/rotas-http.md](contracts/rotas-http.md);
estado e regras: [data-model.md](data-model.md).

## Rodar localmente

```bash
.venv/bin/pip install -r requirements.txt
.venv/bin/python manage.py check
DJANGO_DEBUG=0 DJANGO_SECRET_KEY=teste .venv/bin/python manage.py check --deploy   # conferência de produção
.venv/bin/python manage.py runserver
```

Abrir `http://127.0.0.1:8000/`. Não há `migrate`: o projeto não tem banco.

## Cenários

| # | Requisitos | Cenário | Resultado esperado |
|---|---|---|---|
| 1 | FR-001, FR-026 | Abrir o site pela primeira vez | Campo para colar nomes com instrução do SUAP; sem login |
| 2 | FR-002, FR-004, SC-001 | Colar os 32 alunos do SUAP | Prévia: 32 nomes, iguais ao texto, nenhuma matrícula na tela |
| 3 | FR-003 | Colar "Maria da Silva" e "João Pereira" (um por linha) | Prévia: 2 nomes |
| 4 | FR-005 | Colar "Maria", "MARIA", "mária" | Prévia: 1 nome |
| 5 | FR-006 | Campo vazio ou só espaços; e envio sem JavaScript | Botão "Começar o sorteio" desabilitado; o servidor recusa com "Nenhum nome encontrado"; continua sem lista |
| 6 | FR-007 | Colar 81 nomes | Recusado com o limite de 80 |
| 7 | FR-004 | Usar a lista de 32 | Palco com 32 em "Disponíveis"; contadores 32/0 |
| 8 | FR-010, FR-011, FR-014, SC-004 | Clicar em "Sortear" | Roleta gira só 0 e 1 (mesmo tamanho, linhas em direções opostas, nenhum nome), para em 3–6 s; os bits viram o nome letra a letra em até 2 s; "1º sorteado"; vai para "Já sorteados"; 31/1 |
| 9 | FR-012, FR-015, SC-002 | Sortear até acabar (32) | 32 nomes diferentes; "Sortear" desabilitado com a mensagem de reiniciar |
| 10 | FR-016 | "Reiniciar sorteio" → cancelar; → confirmar | Cancelar: nada muda; confirmar: 32 disponíveis, "Rodada 2" |
| 11 | FR-017 | Sortear 3 e "Desfazer último" | 3º volta a Disponíveis; próximo sorteio recebe a ordem 3º; sem sorteios → desfazer indisponível |
| 12 | FR-013, SC-005 | Duplo clique em "Sortear" (10 vezes) | Cada vez, exatamente 1 nome sorteado |
| 13 | FR-012 | Duas abas: sortear na aba A e depois na aba B (desatualizada) | Aba B recebe aviso para recarregar; nenhum nome repetido |
| 14 | FR-008 | "Adicionar nomes": "Aluno Novo" e um nome já existente | 1 adicionado, 1 já estava; "Aluno Novo" em Disponíveis |
| 15 | FR-009 | "Limpar lista" → confirmar | Volta ao campo de colar nomes |
| 16 | FR-023, SC-007 | Recarregar a página com a lista em uso | Lista, sorteados e rodada continuam |
| 17 | FR-023, SC-007 | Fechar o navegador e abrir de novo | Sem lista |
| 18 | FR-025, SC-007 | Dois navegadores diferentes ao mesmo tempo | Cada um com a sua lista |
| 19 | FR-019, SC-006 | Modo apresentação em 1920×1080 | Só palco e botões; nome grande |
| 20 | FR-020 | Espaço, F e Z; e dentro de um campo de texto | Sorteia, tela cheia, desfaz; ignorados no campo |
| 21 | FR-021, SC-004 | "Reduzir movimento" ativado | Sem giro nem confete; nome em menos de 1 s |
| 22 | FR-022 | Região `aria-live` | "Sorteado: NOME" |
| 23 | FR-024, SC-008 | Rede do navegador + disco do servidor | Nenhuma requisição externa com nomes; nenhum arquivo/banco criado |
| 24 | FR-018 | Ações ao longo do roteiro | Toasts em Português |
| 25 | SC-003 | Do site aberto ao 1º sorteado | Menos de 30 s |
| 26 | Constituição II | GET em `/sortear/` | 405 |
| 27 | Constituição II | Cookie da sessão alterado à mão | Estado rejeitado (volta sem lista), nada é sorteado a partir dele |
| 28 | FR-027 | Colar "1. Maria Silva - 2026ABC", "Ana-Maria Souza", "João D'Ávila", "12345", "---", "###" e "X" | Prévia: 3 nomes ("Maria Silva", "Ana Maria Souza", "João D'Ávila") e o aviso de 4 linhas ignoradas; sem números nem traços |
